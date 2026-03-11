import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { MCentralControls as DialComponent } from '../components/MCentralDial';
import MTempoVisualizer from '../components/MTempoVisualizer';
import TimeSignatureButton from '../components/TimeSignatureButton';
import TimeSignatureModal from '../components/TimeSignatureModal';
import NoteSubdivisionButton from '../components/NoteSubdivisionButton';
import NoteSubdivisionModal from '../components/NoteSubdivisionModal';
import TapTempoButton from '../components/TapTempoButton';
import RhythmTrainingButton from '../components/RhythmTrainingButton';
import RhythmTrainingModal from '../components/RhythmTrainingModal';
import RhythmSettingModal from '../components/RhythmSettingModal';
import HamburgerButton from '../components/HamburgerButton';
import SoundSettingsPanel from '../components/SoundSettingsPanel';
import PracticeSessionLibraryModal, { PracticeSessionListItem } from '../components/PracticeSessionLibraryModal';
import PracticeSessionSaveModal from '../components/PracticeSessionSaveModal';
import { useMetronomeStore, TimeSignature } from '../components/useMetronomeStore';
import { useRhythmTraining, RhythmTrainingMode } from '../components/useRhythmTraining';
import { MetronomeEngine, TapTempo } from '../components/MetronomeEngine';
import { MetronomeSoundEngine } from '../components/MetronomeSoundEngine';
import { usePracticeData } from '../contexts/PracticeDataContext';
import PracticeIcon from '../assets/icons/MS_practice.svg?react';
import TapIcon from '../assets/icons/MS_tap.svg?react';
import LibraryIcon from '../assets/icons/MS_ lib.svg?react';

type BeatStrength = 0 | 1 | 2 | 'A';

type StoredSessionSource = 'today' | 'saved';

interface SavedMetronomeSession {
  id: string;
  title: string;
  bpm: number;
  numerator: number;
  denominator: number;
  updatedAt: number;
  lastViewedAt: number;
}

interface TrackMetronomeSetting {
  trackId: number;
  bpm: number;
  numerator: number;
  denominator: number;
  updatedAt: number;
  lastViewedAt: number;
}

interface LastViewedSession {
  source: StoredSessionSource;
  id: string;
}

interface ActiveSessionState {
  source: 'none' | StoredSessionSource;
  id: string | null;
  title: string;
  hasStoredConfig: boolean;
  baseline: { bpm: number; numerator: number; denominator: number } | null;
}

const SAVED_SESSIONS_KEY = 'metronome.savedSessions.v1';
const TRACK_SETTINGS_KEY = 'metronome.trackSettings.v1';
const LAST_VIEWED_SESSION_KEY = 'metronome.lastViewedSession.v1';
const FLASH_STORAGE_KEY = 'metronome.fullscreenFlashEnabled';

const readLocalStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeLocalStorage = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
};

const createDefaultBeatPattern = (beatCount: number): BeatStrength[] =>
  Array.from({ length: beatCount }, (_, index) => (index === 0 ? 'A' : 2));

const nextBeatStrength = (current: BeatStrength): BeatStrength => {
  switch (current) {
    case 'A':
      return 2;
    case 2:
      return 1;
    case 1:
      return 0;
    case 0:
    default:
      return 'A';
  }
};

function Metronome() {
  const tapInstructionTimeoutRef = useRef<number | null>(null);
  const sessionInitRef = useRef(false);
  const location = useLocation();
  const { tracks } = usePracticeData();
  
  const {
    bpm,
    isPlaying,
    currentBeat,
    timeSignature,
    setBpm,
    setTimeSignature,
    setCurrentBeat,
    setIsPlaying,
    getBeatPattern
  } = useMetronomeStore();

  const {
    activeMode,
    songLength,
    incrementalTempo,
    mutePattern,
    setActiveMode,
    setSongLengthSettings,
    setIncrementalTempoSettings,
    setMutePatternSettings,
    getStatusText,
    registerBPMChangeCallback,
    registerStopCallback,
    isMuted
  } = useRhythmTraining();

  // MetronomeEngine and TapTempo instances
  const engineRef = useRef<MetronomeEngine | null>(null);
  const tapTempoRef = useRef<TapTempo | null>(null);

  // Modal states
  const [isTimeSignatureModalOpen, setIsTimeSignatureModalOpen] = useState(false);
  const [isNoteSubdivisionModalOpen, setIsNoteSubdivisionModalOpen] = useState(false);
  const [isRhythmTrainingModalOpen, setIsRhythmTrainingModalOpen] = useState(false);
  const [isRhythmSettingModalOpen, setIsRhythmSettingModalOpen] = useState(false);
  const [selectedSettingMode, setSelectedSettingMode] = useState<RhythmTrainingMode>('none');
  
  // Sound settings panel state
  const [isSoundPanelOpen, setIsSoundPanelOpen] = useState(false);
  const [isFullScreenFlashEnabled, setIsFullScreenFlashEnabled] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.localStorage.getItem(FLASH_STORAGE_KEY) === '1'
  );
  const [flashPulseKey, setFlashPulseKey] = useState(0);
  const [flashPeakOpacity, setFlashPeakOpacity] = useState(0);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() =>
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [tapTempoMessage, setTapTempoMessage] = useState<string | null>(null);
  const [isSessionLibraryOpen, setIsSessionLibraryOpen] = useState(false);
  const [isSessionSaveModalOpen, setIsSessionSaveModalOpen] = useState(false);
  const [sessionSaveName, setSessionSaveName] = useState('');
  const [pendingOpenLibraryAfterSave, setPendingOpenLibraryAfterSave] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedMetronomeSession[]>(() =>
    readLocalStorage<SavedMetronomeSession[]>(SAVED_SESSIONS_KEY, [])
  );
  const [trackSettings, setTrackSettings] = useState<Record<string, TrackMetronomeSetting>>(() =>
    readLocalStorage<Record<string, TrackMetronomeSetting>>(TRACK_SETTINGS_KEY, {})
  );
  const [activeSession, setActiveSession] = useState<ActiveSessionState>({
    source: 'none',
    id: null,
    title: 'Practice Session',
    hasStoredConfig: false,
    baseline: null
  });

  // Rhythm subdivision related state
  const [selectedRhythmId, setSelectedRhythmId] = useState('one_beat');
  const [editableBeatPattern, setEditableBeatPattern] = useState<BeatStrength[]>(() =>
    createDefaultBeatPattern(4)
  );
  const beatPatternRef = useRef<BeatStrength[]>(editableBeatPattern);
  const fullScreenFlashEnabledRef = useRef<boolean>(isFullScreenFlashEnabled);
  const isDarkThemeRef = useRef<boolean>(isDarkTheme);
  const rhythmSubdivBtnRef = useRef<HTMLButtonElement | null>(null);

// Initialize MetronomeEngine instances (without audio initialization)
useEffect(() => {
  console.log('useEffect 시작됨 - 메트로놈 엔진 생성 중...');
  
  try {
    const engine = new MetronomeEngine();
    console.log('MetronomeEngine 생성됨:', engine);
    
    const tapTempo = new TapTempo();
    console.log('TapTempo 생성됨:', tapTempo);
    
    // Set up callbacks
    engine.setCallbacks({
      onBeatChange: (beat: number) => {
        console.log('박자 변경:', beat);
        setCurrentBeat(beat);
        if (!fullScreenFlashEnabledRef.current) return;

        const beatType = beatPatternRef.current[beat] ?? (beat === 0 ? 'A' : 2);
        if (beatType === 0) return;

        const peakOpacityByBeatType = isDarkThemeRef.current
          ? (beatType === 'A' ? 0.48 : beatType === 2 ? 0.38 : 0.24)
          : (beatType === 'A' ? 0.42 : beatType === 2 ? 0.33 : 0.2);

        setFlashPeakOpacity(peakOpacityByBeatType);
        setFlashPulseKey((prev) => prev + 1);
      },
      onBPMChange: (newBpm: number) => {
        console.log('BPM 변경:', newBpm);
        setBpm(newBpm);
      },
      onStop: () => {
        console.log('메트로놈 정지됨');
        setIsPlaying(false);
      }
    });

    engineRef.current = engine;
    tapTempoRef.current = tapTempo;
    
    console.log('engineRef.current 할당됨:', engineRef.current);
    console.log('메트로놈 엔진 인스턴스 생성 완료');
  } catch (error) {
    console.error('엔진 생성 중 오류:', error);
  }

  // Cleanup
  return () => {
    console.log('cleanup 실행됨');
    if (engineRef.current) {
      engineRef.current.dispose();
    }
  };
}, []);

  useEffect(() => {
    beatPatternRef.current = editableBeatPattern;
  }, [editableBeatPattern]);

  useEffect(() => {
    fullScreenFlashEnabledRef.current = isFullScreenFlashEnabled;
  }, [isFullScreenFlashEnabled]);

  useEffect(() => {
    isDarkThemeRef.current = isDarkTheme;
  }, [isDarkTheme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const updateTheme = () => {
      setIsDarkTheme(root.getAttribute('data-theme') === 'dark');
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Update engine when configuration changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateConfig({
        bpm,
        timeSignature,
        rhythmPatternId: selectedRhythmId,
        isMuted,
        beatPattern: editableBeatPattern
      });
    }
  }, [bpm, timeSignature, selectedRhythmId, isMuted, editableBeatPattern]);

  // Prevent scrolling
  useEffect(() => {
    if (location.pathname === '/metronome') {
      const originalBodyStyle = document.body.style.cssText;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';

      return () => {
        document.body.style.cssText = originalBodyStyle;
      };
    }
  }, [location.pathname]);

  // Register rhythm training callbacks
  useEffect(() => {
    registerBPMChangeCallback((newBpm: number) => {
      setBpm(newBpm);
      if (engineRef.current) {
        engineRef.current.updateConfig({ bpm: newBpm });
      }
    });
    
    registerStopCallback(() => {
      handleTogglePlay();
    });
  }, [setBpm, registerBPMChangeCallback, registerStopCallback]);

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  };

  useEffect(() => {
    writeLocalStorage(SAVED_SESSIONS_KEY, savedSessions);
  }, [savedSessions]);

  useEffect(() => {
    writeLocalStorage(TRACK_SETTINGS_KEY, trackSettings);
  }, [trackSettings]);

  const sessionLibraryItems = useMemo<PracticeSessionListItem[]>(() => {
    const todayItems: PracticeSessionListItem[] = tracks.map((track) => {
      const setting = trackSettings[String(track.id)];
      return {
        id: String(track.id),
        source: 'today',
        title: track.title,
        bpm: setting?.bpm,
        numerator: setting?.numerator,
        denominator: setting?.denominator
      };
    });

    const savedItems: PracticeSessionListItem[] = savedSessions.map((session) => ({
      id: session.id,
      source: 'saved',
      title: session.title,
      bpm: session.bpm,
      numerator: session.numerator,
      denominator: session.denominator
    }));

    return [...todayItems, ...savedItems];
  }, [tracks, trackSettings, savedSessions]);

  const persistLastViewed = useCallback((source: StoredSessionSource, id: string) => {
    writeLocalStorage(LAST_VIEWED_SESSION_KEY, { source, id } as LastViewedSession);
  }, []);

  const currentSignature = `${timeSignature.numerator}/${timeSignature.denominator}`;

  const hasUnsavedSessionChange = useMemo(() => {
    if (activeSession.source === 'none') return true;
    if (activeSession.source === 'today' && !activeSession.hasStoredConfig) return true;
    if (!activeSession.baseline) return true;
    return (
      activeSession.baseline.bpm !== bpm ||
      activeSession.baseline.numerator !== timeSignature.numerator ||
      activeSession.baseline.denominator !== timeSignature.denominator
    );
  }, [activeSession, bpm, timeSignature.numerator, timeSignature.denominator]);

  const applySessionItem = useCallback((item: PracticeSessionListItem) => {
    if (item.source === 'today') {
      const trackSetting = trackSettings[item.id];
      if (trackSetting) {
        setBpm(trackSetting.bpm);
        setTimeSignature({
          numerator: trackSetting.numerator,
          denominator: trackSetting.denominator
        });
      }
      setActiveSession({
        source: 'today',
        id: item.id,
        title: item.title,
        hasStoredConfig: Boolean(trackSetting),
        baseline: trackSetting
          ? {
              bpm: trackSetting.bpm,
              numerator: trackSetting.numerator,
              denominator: trackSetting.denominator
            }
          : null
      });
      persistLastViewed('today', item.id);
      return;
    }

    const saved = savedSessions.find((session) => session.id === item.id);
    if (!saved) return;
    setBpm(saved.bpm);
    setTimeSignature({
      numerator: saved.numerator,
      denominator: saved.denominator
    });
    setActiveSession({
      source: 'saved',
      id: saved.id,
      title: saved.title,
      hasStoredConfig: true,
      baseline: {
        bpm: saved.bpm,
        numerator: saved.numerator,
        denominator: saved.denominator
      }
    });
    persistLastViewed('saved', saved.id);
  }, [persistLastViewed, savedSessions, setBpm, setTimeSignature, trackSettings]);

  useEffect(() => {
    if (sessionInitRef.current) return;
    if (tracks.length === 0 && savedSessions.length === 0) {
      sessionInitRef.current = true;
      return;
    }

    const lastViewed = readLocalStorage<LastViewedSession | null>(LAST_VIEWED_SESSION_KEY, null);
    if (lastViewed?.source === 'today') {
      const todayItem = sessionLibraryItems.find(
        (item) => item.source === 'today' && item.id === lastViewed.id
      );
      if (todayItem) {
        applySessionItem(todayItem);
        sessionInitRef.current = true;
        return;
      }
    }

    if (lastViewed?.source === 'saved') {
      const savedItem = sessionLibraryItems.find(
        (item) => item.source === 'saved' && item.id === lastViewed.id
      );
      if (savedItem) {
        applySessionItem(savedItem);
        sessionInitRef.current = true;
        return;
      }
    }

    sessionInitRef.current = true;
  }, [applySessionItem, sessionLibraryItems, tracks.length, savedSessions.length]);

  const handleSessionLibrarySelect = useCallback((item: PracticeSessionListItem) => {
    applySessionItem(item);
    setIsSessionLibraryOpen(false);
  }, [applySessionItem]);

  const handleSessionLibraryDelete = useCallback((item: PracticeSessionListItem) => {
    if (item.source === 'today') {
      setTrackSettings((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      if (activeSession.source === 'today' && activeSession.id === item.id) {
        setActiveSession((prev) => ({
          ...prev,
          hasStoredConfig: false,
          baseline: null
        }));
      }
      return;
    }

    setSavedSessions((prev) => prev.filter((session) => session.id !== item.id));

    if (activeSession.source === 'saved' && activeSession.id === item.id) {
      setActiveSession({
        source: 'none',
        id: null,
        title: 'Practice Session',
        hasStoredConfig: false,
        baseline: null
      });
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LAST_VIEWED_SESSION_KEY);
      }
    }
  }, [activeSession.id, activeSession.source]);

  const handlePracticeIconClick = useCallback(() => {
    if (!hasUnsavedSessionChange) return;
    const initialName = activeSession.title === 'Practice Session' ? '' : activeSession.title;
    setSessionSaveName(initialName);
    setIsSessionSaveModalOpen(true);
    setPendingOpenLibraryAfterSave(false);
  }, [activeSession.title, hasUnsavedSessionChange]);

  const handleLibraryClick = useCallback(() => {
    if (tapTempoMessage) return;
    if (hasUnsavedSessionChange) {
      const initialName = activeSession.title === 'Practice Session' ? '' : activeSession.title;
      setSessionSaveName(initialName);
      setPendingOpenLibraryAfterSave(true);
      setIsSessionSaveModalOpen(true);
      return;
    }
    setIsSessionLibraryOpen((prev) => !prev);
  }, [activeSession.title, hasUnsavedSessionChange, tapTempoMessage]);

  const handleSessionSaveConfirm = useCallback((inputName: string) => {
    const now = Date.now();
    const trimmedName = inputName.trim();
    const currentConfig = {
      bpm,
      numerator: timeSignature.numerator,
      denominator: timeSignature.denominator
    };

    if (activeSession.source === 'today' && activeSession.id) {
      const trackId = activeSession.id;
      const updatedTrackSetting: TrackMetronomeSetting = {
        trackId: Number(trackId),
        ...currentConfig,
        updatedAt: now,
        lastViewedAt: now
      };
      setTrackSettings((prev) => ({
        ...prev,
        [trackId]: updatedTrackSetting
      }));
      setActiveSession((prev) => ({
        ...prev,
        hasStoredConfig: true,
        baseline: { ...currentConfig }
      }));
      persistLastViewed('today', trackId);

      if (trimmedName && trimmedName !== activeSession.title) {
        const newSavedSession: SavedMetronomeSession = {
          id: `saved_${now}`,
          title: trimmedName,
          ...currentConfig,
          updatedAt: now,
          lastViewedAt: now
        };
        setSavedSessions((prev) => [newSavedSession, ...prev]);
      }
    } else {
      if (activeSession.source === 'saved' && activeSession.id) {
        const targetId = activeSession.id;
        setSavedSessions((prev) =>
          prev.map((session) =>
            session.id === targetId
              ? {
                  ...session,
                  title: trimmedName || session.title,
                  ...currentConfig,
                  updatedAt: now,
                  lastViewedAt: now
                }
              : session
          )
        );
        setActiveSession((prev) => ({
          ...prev,
          title: trimmedName || prev.title,
          baseline: { ...currentConfig },
          hasStoredConfig: true
        }));
        persistLastViewed('saved', targetId);
      } else {
        const fallbackName = trimmedName || `세션 ${new Date(now).toLocaleString('ko-KR')}`;
        const newSavedSession: SavedMetronomeSession = {
          id: `saved_${now}`,
          title: fallbackName,
          ...currentConfig,
          updatedAt: now,
          lastViewedAt: now
        };
        setSavedSessions((prev) => [newSavedSession, ...prev]);
        setActiveSession({
          source: 'saved',
          id: newSavedSession.id,
          title: newSavedSession.title,
          hasStoredConfig: true,
          baseline: { ...currentConfig }
        });
        persistLastViewed('saved', newSavedSession.id);
      }
    }

    setIsSessionSaveModalOpen(false);
    if (pendingOpenLibraryAfterSave) {
      setIsSessionLibraryOpen(true);
      setPendingOpenLibraryAfterSave(false);
    }
  }, [activeSession, bpm, pendingOpenLibraryAfterSave, persistLastViewed, timeSignature.denominator, timeSignature.numerator]);

  // Main play/stop handler with lazy initialization
const handleTogglePlay = async () => {
    // 동기 함수로 바뀐 unlockAudio를 가장 먼저 호출
    MetronomeSoundEngine.getInstance().unlockAudio();

    if (!engineRef.current) {
      return;
    }

    try {
      if (isPlaying) {
        engineRef.current.stop();
        setIsPlaying(false);
      } else {
        // Initialize engine only when user first clicks (user gesture required)
        console.log('첫 재생 시도 - 엔진 초기화 중...');
        await engineRef.current.initialize();
        
        // Apply current configuration
        engineRef.current.updateConfig({
          bpm,
          timeSignature,
          rhythmPatternId: selectedRhythmId,
          isMuted,
          beatPattern: editableBeatPattern
        });
        
        await engineRef.current.start();
        setIsPlaying(true);
        console.log('메트로놈 시작됨');
      }
    } catch (error) {
      console.error('메트로놈 재생/정지 실패:', error);
      alert('메트로놈을 시작할 수 없습니다. 오디오 권한을 확인해주세요.');
    }
  };

  // BPM change handler
  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
  };

  // Time signature handlers
  const handleTimeSignatureClick = () => {
    setIsTimeSignatureModalOpen(true);
    setIsNoteSubdivisionModalOpen(false);
    setIsRhythmTrainingModalOpen(false);
    setIsRhythmSettingModalOpen(false);
  };

  const handleTimeSignatureConfirm = (signature: TimeSignature) => {
    setTimeSignature(signature);
    setCurrentBeat(0);
  };

  // Note subdivision handlers
  const handleNoteSubdivisionClick = () => {
    setIsNoteSubdivisionModalOpen(true);
    setIsTimeSignatureModalOpen(false);
    setIsRhythmTrainingModalOpen(false);
    setIsRhythmSettingModalOpen(false);
  };

  const handleRhythmSelect = (rhythmId: string) => {
    setSelectedRhythmId(rhythmId);
    console.log('리듬 패턴 선택:', rhythmId);
  };

  const handleBeatPatternEdit = (beatIndex: number) => {
    setEditableBeatPattern(prev => {
      const next = [...prev];
      next[beatIndex] = nextBeatStrength(next[beatIndex] ?? (beatIndex === 0 ? 'A' : 2));
      return next;
    });
  };

  // Rhythm training handlers
  const handleRhythmTrainingClick = () => {
    setIsRhythmTrainingModalOpen(true);
    setIsTimeSignatureModalOpen(false);
    setIsNoteSubdivisionModalOpen(false);
    setIsRhythmSettingModalOpen(false);
  };

  const handleRhythmModeSelect = (mode: RhythmTrainingMode) => {
    setIsRhythmTrainingModalOpen(false);
    
    if (mode === 'none') {
      setActiveMode('none');
      return;
    }
    
    setTimeout(() => {
      setSelectedSettingMode(mode);
      setIsRhythmSettingModalOpen(true);
    }, 100);
  };

  const handleRhythmSettingComplete = () => {
    if (selectedSettingMode !== 'none') {
      setActiveMode(selectedSettingMode);
    }
  };

  const handleSongLengthChange = (settings: typeof songLength) => {
    setSongLengthSettings(settings);
    handleRhythmSettingComplete();
  };

  const handleIncrementalTempoChange = (settings: typeof incrementalTempo) => {
    setIncrementalTempoSettings(settings);
    handleRhythmSettingComplete();
  };

  const handleMutePatternChange = (settings: typeof mutePattern) => {
    setMutePatternSettings(settings);
    handleRhythmSettingComplete();
  };

  // Tap tempo handler
  const handleTapTempoClick = () => {
    if (!tapTempoRef.current) return;

    const calculatedBpm = tapTempoRef.current.tap();
    const tapCount = tapTempoRef.current.getTapCount();

    if (tapInstructionTimeoutRef.current) {
      window.clearTimeout(tapInstructionTimeoutRef.current);
    }

    if (calculatedBpm && tapCount >= 4) {
      setBpm(calculatedBpm);
      setTapTempoMessage(null);
      console.log('탭 템포로 BPM 설정:', calculatedBpm);
    } else {
      setTapTempoMessage('계속 탭하십시오');
      tapInstructionTimeoutRef.current = window.setTimeout(() => {
        setTapTempoMessage(null);
      }, 2000);
      console.log('탭 템포 계산 중... (탭 횟수:', tapCount, ')');
    }
  };

  const handleModalClose = () => {
    setIsTimeSignatureModalOpen(false);
    setIsNoteSubdivisionModalOpen(false);
    setIsRhythmTrainingModalOpen(false);
    setIsRhythmSettingModalOpen(false);
    setSelectedSettingMode('none');
    setIsSoundPanelOpen(false);
    setIsSessionLibraryOpen(false);
    setIsSessionSaveModalOpen(false);
  };

  // Check if any modal is open
  const isAnyModalOpen = isTimeSignatureModalOpen || isNoteSubdivisionModalOpen || 
                        isRhythmTrainingModalOpen || isRhythmSettingModalOpen || isSoundPanelOpen;

  // Training status text
  const statusText = getStatusText();

  useEffect(() => {
    setEditableBeatPattern(prev => {
      const next = createDefaultBeatPattern(timeSignature.numerator);
      for (let i = 0; i < Math.min(prev.length, next.length); i += 1) {
        next[i] = prev[i];
      }
      return next;
    });
  }, [timeSignature.numerator]);

  const visualizerBeatPattern = editableBeatPattern;

  useEffect(() => {
    return () => {
      if (tapInstructionTimeoutRef.current) {
        window.clearTimeout(tapInstructionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        background: "var(--bg-primary)",
        overflowX: "hidden",
        overflowY: "hidden",
        margin: "0 auto",
        padding: "0",
        boxSizing: "border-box",
        ...commonFontStyle,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100vh",
          position: "relative",
          boxSizing: "border-box",
          ...commonFontStyle,
        }}
      >
        {/* Hamburger button for sound settings */}
        <HamburgerButton 
          isOpen={isSoundPanelOpen}
          onClick={() => setIsSoundPanelOpen(!isSoundPanelOpen)}
        />

        <button
          type="button"
          onClick={handleLibraryClick}
          aria-label="곡목록"
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            width: "44px",
            height: "44px",
            zIndex: 1001,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-primary)",
            transition: "transform 0.3s ease",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <LibraryIcon width={24} height={24} />
        </button>

        {/* Sound settings panel */}
        {isSoundPanelOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: "calc(65px + env(safe-area-inset-bottom))",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 2000,
              backdropFilter: "blur(4px)"
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsSoundPanelOpen(false);
              }
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                width: "100%",
                maxWidth: "100%",
                bottom: 0,
                backgroundColor: "var(--bg-primary)",
                overflowY: "auto",
                padding: "0",
                boxShadow: "0 -2px 20px rgba(0, 0, 0, 0.08)"
              }}
            >
              <SoundSettingsPanel
                onFullScreenFlashEnabledChange={setIsFullScreenFlashEnabled}
              />
            </div>
          </div>
        )}
        {/* Top: Beat visualization - 80px */}
        <div style={{ 
          position: "absolute",
          top: "80px",
          left: timeSignature.numerator >= 16 ? "10px" : "16px",
          right: timeSignature.numerator >= 16 ? "10px" : "16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: timeSignature.numerator >= 16 ? "calc(100% - 20px)" : "calc(100% - 32px)"
        }}>
          <MTempoVisualizer
            beatCount={timeSignature.numerator}
            currentBeat={currentBeat}
            beatPattern={visualizerBeatPattern}
            onBeatClick={handleBeatPatternEdit}
          />
        </div>

        {/* Center: Control button area - 180px */}
        <div style={{ 
          position: "absolute",
          top: "180px",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          zIndex: isAnyModalOpen ? 1001 : 1
        }}>
          <div style={{
            display: "flex",
            gap: "65px",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <TimeSignatureButton 
              currentSignature={timeSignature}
              onSignatureChange={setTimeSignature}
              onClick={handleTimeSignatureClick}
            />
            
            <NoteSubdivisionButton 
              ref={rhythmSubdivBtnRef}
              onClick={handleNoteSubdivisionClick}
              currentRhythmId={selectedRhythmId}
              denominator={timeSignature.denominator}
            />
            
            <RhythmTrainingButton 
              onClick={handleRhythmTrainingClick}
              activeMode={activeMode}
            />
          </div>
        </div>

        {/* Training status display */}
        {activeMode !== 'none' && statusText && (
          <div style={{
            position: "absolute",
            top: "280px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
          }}>
            <div style={{
              background: "var(--bg-secondary, #f8f9fa)",
              border: "1px solid var(--DARK_GRAY)",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "14px",
              color: "var(--text-secondary)",
              fontWeight: "500"
            }}>
              {statusText}
            </div>
          </div>
        )}

        {/* Song info display (only in default mode) */}
        {activeMode === 'none' && (
          <div style={{
            position: "absolute",
            top: "280px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
          }}>
            {tapTempoMessage ? (
              <div style={{
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <TapIcon width={20} height={20} />
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePracticeIconClick}
                aria-label="세션 저장"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  color: "var(--text-primary)",
                  cursor: hasUnsavedSessionChange ? "pointer" : "default"
                }}
              >
                <PracticeIcon width={20} height={20} />
              </button>
            )}
            <span style={{
              fontSize: "16px",
              color: "var(--text-primary)",
              fontWeight: "normal",
              maxWidth: "170px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {tapTempoMessage ?? activeSession.title}
            </span>
          </div>
        )}

        {/* Center: BPM dial - 350px */}
        <div style={{ 
          position: "absolute",
          top: "350px",
          left: 0,
          right: 0,
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          width: "100%"
        }}>
          <DialComponent
            currentBPM={bpm}
            isPlaying={isPlaying}
            onBPMChange={handleBpmChange}
            onPlayToggle={handleTogglePlay}
            enableDrag={true}
            enableKeyboard={true}
          />
        </div>

        {/* TapTempo button - mirrored position to the right of Play button */}
        <div style={{ 
          position: "absolute",
          top: "355px",
          left: 0,
          right: 0,
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          width: "100%",
          pointerEvents: "none"
        }}>
          <div style={{
            position: "relative",
            width: "180px",
            height: "180px",
            pointerEvents: "none"
          }}>
            <div style={{
              position: "absolute",
              bottom: "-40px",
              right: "-40px",
              pointerEvents: "auto",
              zIndex: isAnyModalOpen ? 999 : 1002
            }}>
              <TapTempoButton onClick={handleTapTempoClick} />
            </div>
          </div>
        </div>

        {isFullScreenFlashEnabled && isPlaying && !isAnyModalOpen && (
          <div
            key={flashPulseKey}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 5000,
              backgroundColor: "var(--LIVING_CORAL)",
              opacity: 0,
              animation: "metronomeScreenFlash 190ms ease-out",
              willChange: "opacity",
              ["--flash-peak-opacity" as string]: String(flashPeakOpacity)
            }}
          />
        )}
      </div>

      {/* Time signature modal */}
      <TimeSignatureModal
        isOpen={isTimeSignatureModalOpen}
        onClose={handleModalClose}
        currentSignature={timeSignature}
        onConfirm={handleTimeSignatureConfirm}
        anchorTop={230}
      />

      {/* Rhythm subdivision modal */}
      <NoteSubdivisionModal
        isOpen={isNoteSubdivisionModalOpen}
        onClose={handleModalClose}
        onSelect={handleRhythmSelect}
        anchorTop={230}
        currentRhythmId={selectedRhythmId}
      />

      {/* Rhythm training option selection modal */}
      <RhythmTrainingModal
        isOpen={isRhythmTrainingModalOpen && !isRhythmSettingModalOpen}
        onClose={handleModalClose}
        onSelectMode={handleRhythmModeSelect}
        anchorTop={230}
      />

      {/* Rhythm training settings modal */}
      <RhythmSettingModal
        isOpen={isRhythmSettingModalOpen && !isRhythmTrainingModalOpen}
        onClose={() => {
          setIsRhythmSettingModalOpen(false);
          setSelectedSettingMode('none');
        }}
        mode={selectedSettingMode}
        songLengthSettings={songLength}
        incrementalTempoSettings={incrementalTempo}
        mutePatternSettings={mutePattern}
        onSongLengthChange={handleSongLengthChange}
        onIncrementalTempoChange={handleIncrementalTempoChange}
        onMutePatternChange={handleMutePatternChange}
        currentBPM={bpm}
        anchorTop={230}
      />

      <PracticeSessionLibraryModal
        isOpen={isSessionLibraryOpen}
        onClose={() => setIsSessionLibraryOpen(false)}
        onSelect={handleSessionLibrarySelect}
        onDelete={handleSessionLibraryDelete}
        items={sessionLibraryItems}
        anchorTop={230}
      />

      <PracticeSessionSaveModal
        isOpen={isSessionSaveModalOpen}
        initialName={sessionSaveName}
        onClose={() => {
          setIsSessionSaveModalOpen(false);
          setPendingOpenLibraryAfterSave(false);
        }}
        onConfirm={handleSessionSaveConfirm}
      />

      <style>
        {`
          @keyframes pulse {
            0% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.2);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes metronomeScreenFlash {
            0% {
              opacity: 0;
            }
            15% {
              opacity: var(--flash-peak-opacity, 0.12);
            }
            100% {
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}

export default Metronome;
