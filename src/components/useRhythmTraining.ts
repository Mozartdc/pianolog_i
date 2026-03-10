// src/components/useRhythmTraining.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMetronomeStore } from './useMetronomeStore';

export type RhythmTrainingMode = 'none' | 'songLength' | 'incrementalTempo' | 'mutePattern';

// Common mode type
type TrainingModeType = 'off' | 'bars' | 'duration';

// Song length settings
export interface SongLengthSettings {
  mode: TrainingModeType;
  bars: number; // 1-100
  duration: number; // seconds (1초-5999초 = 99분59초)
}

// Incremental tempo change
export interface IncrementalTempoSettings {
  mode: TrainingModeType;
  bars: {
    step: number; // -40 ~ +40 BPM
    interval: number; // 1-99 bars
    limit: number; // 20 ~ current BPM
  };
  duration: {
    step: number; // -40 ~ +40 BPM  
    interval: number; // 5-200 seconds (5 second intervals)
    limit: number; // 20 ~ current BPM
  };
}

// Mute pattern settings
export interface MutePatternSettings {
  mode: TrainingModeType;
  bars: {
    muteLength: number; // 1-99 bars
    soundLength: number; // 1-99 bars
  };
  duration: {
    muteLength: number; // 1-99 seconds
    soundLength: number; // 1-99 seconds
  };
}

// Training state
interface TrainingState {
  isActive: boolean;
  startTime: number | null;
  currentBeat: number;
  currentBar: number;
  elapsedTime: number; // seconds
  
  // Incremental tempo related
  currentBPM: number;
  lastTempoChangeTime: number;
  lastTempoChangeBeat: number;
  
  // Mute related
  isMuted: boolean;
  muteStartTime: number | null;
  muteStartBeat: number | null;
}

export const useRhythmTraining = () => {
  const { bpm, isPlaying, currentBeat, timeSignature } = useMetronomeStore();

  // Active mode
  const [activeMode, setActiveMode] = useState<RhythmTrainingMode>('none');

  // Settings for each feature
  const [songLength, setSongLengthSettings] = useState<SongLengthSettings>({
    mode: 'off',
    bars: 1,  // Default 1 bar
    duration: 0 // Default 0 minutes 0 seconds
  });

  const [incrementalTempo, setIncrementalTempoSettings] = useState<IncrementalTempoSettings>({
    mode: 'off',
    bars: {
      step: 1,   // Default +1 BPM
      interval: 1, // Default 1 bar
      limit: bpm   // Current setting BPM
    },
    duration: {
      step: 1,     // Default +1 BPM
      interval: 5, // Default 5 seconds
      limit: bpm   // Current setting BPM
    }
  });

  const [mutePattern, setMutePatternSettings] = useState<MutePatternSettings>({
    mode: 'off',
    bars: {
      muteLength: 1,  // Default 1 bar
      soundLength: 1  // Default 1 bar
    },
    duration: {
      muteLength: 1,  // Default 1 second
      soundLength: 1  // Default 1 second
    }
  });

  // Training state
  const [trainingState, setTrainingState] = useState<TrainingState>({
    isActive: false,
    startTime: null,
    currentBeat: 0,
    currentBar: 0,
    elapsedTime: 0,
    currentBPM: bpm,
    lastTempoChangeTime: 0,
    lastTempoChangeBeat: 0,
    isMuted: false,
    muteStartTime: null,
    muteStartBeat: null
  });

  const intervalRef = useRef<number | null>(null);

  // BPM change callback (for incremental tempo)
  const onBPMChange = useRef<((newBPM: number) => void) | null>(null);

  // Metronome stop callback (for song length)
  const onStop = useRef<(() => void) | null>(null);

  // Detect metronome start/stop
  useEffect(() => {
    if (isPlaying && !trainingState.isActive && activeMode !== 'none') {
      // Start training
      const now = Date.now();
      setTrainingState(prev => ({
        ...prev,
        isActive: true,
        startTime: now,
        currentBeat: 0,
        currentBar: 0,
        elapsedTime: 0,
        currentBPM: bpm,
        lastTempoChangeTime: now,
        lastTempoChangeBeat: 0,
        isMuted: false,
        muteStartTime: null,
        muteStartBeat: null
      }));
    } else if (!isPlaying && trainingState.isActive) {
      // Stop training
      setTrainingState(prev => ({
        ...prev,
        isActive: false,
        startTime: null
      }));
    }
  }, [isPlaying, activeMode, trainingState.isActive, bpm]);

  // Execute training logic
  useEffect(() => {
    if (!trainingState.isActive || !isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTrainingState(prev => {
        const now = Date.now();
        const elapsedMs = now - (prev.startTime || now);
        const newElapsedTime = Math.floor(elapsedMs / 1000);
        
        // Calculate beats (based on BPM and time signature)
        const beatDuration = 60000 / prev.currentBPM; // ms per beat
        const totalBeats = Math.floor(elapsedMs / beatDuration);
        const newCurrentBar = Math.floor(totalBeats / timeSignature.numerator);

        let newState = {
          ...prev,
          elapsedTime: newElapsedTime,
          currentBeat: totalBeats,
          currentBar: newCurrentBar
        };

        // 1. Check song length
        if (activeMode === 'songLength' && songLength.mode !== 'off') {
          let shouldStop = false;
          
          if (songLength.mode === 'bars' && newCurrentBar >= songLength.bars) {
            shouldStop = true;
          } else if (songLength.mode === 'duration' && newElapsedTime >= songLength.duration) {
            shouldStop = true;
          }
          
          if (shouldStop) {
            onStop.current?.();
            return { ...newState, isActive: false };
          }
        }

        // 2. Check incremental tempo
        if (activeMode === 'incrementalTempo' && incrementalTempo.mode !== 'off') {
          const settings = incrementalTempo.mode === 'bars' 
            ? incrementalTempo.bars 
            : incrementalTempo.duration;
          
          let shouldChangeTemoo = false;
          
          if (incrementalTempo.mode === 'bars') {
            const barsSinceLastChange = newCurrentBar - Math.floor(prev.lastTempoChangeBeat / timeSignature.numerator);
            shouldChangeTemoo = barsSinceLastChange >= settings.interval;
          } else {
            const timeSinceLastChange = (now - prev.lastTempoChangeTime) / 1000;
            shouldChangeTemoo = timeSinceLastChange >= settings.interval;
          }
          
          if (shouldChangeTemoo) {
            const newBPM = Math.max(20, Math.min(settings.limit, prev.currentBPM + settings.step));
            if (newBPM !== prev.currentBPM) {
              onBPMChange.current?.(newBPM);
              newState.currentBPM = newBPM;
              newState.lastTempoChangeTime = now;
              newState.lastTempoChangeBeat = totalBeats;
            }
          }
        }

        // 3. Check mute pattern
        if (activeMode === 'mutePattern' && mutePattern.mode !== 'off') {
          const settings = mutePattern.mode === 'bars' 
            ? mutePattern.bars 
            : mutePattern.duration;
          
          if (!prev.isMuted) {
            // Currently playing sound - check if should mute
            let shouldMute = false;
            
            if (mutePattern.mode === 'bars') {
              const barsInSound = newCurrentBar - Math.floor((prev.muteStartBeat || 0) / timeSignature.numerator);
              shouldMute = barsInSound >= settings.soundLength;
            } else {
              const timeInSound = (now - (prev.muteStartTime || now)) / 1000;
              shouldMute = timeInSound >= settings.soundLength;
            }
            
            if (shouldMute) {
              newState.isMuted = true;
              newState.muteStartTime = now;
              newState.muteStartBeat = totalBeats;
            }
          } else {
            // Currently muted - check if should unmute
            let shouldUnmute = false;
            
            if (mutePattern.mode === 'bars') {
              const barsInMute = newCurrentBar - Math.floor((prev.muteStartBeat || 0) / timeSignature.numerator);
              shouldUnmute = barsInMute >= settings.muteLength;
            } else {
              const timeInMute = (now - (prev.muteStartTime || now)) / 1000;
              shouldUnmute = timeInMute >= settings.muteLength;
            }
            
            if (shouldUnmute) {
              newState.isMuted = false;
              newState.muteStartTime = now;
              newState.muteStartBeat = totalBeats;
            }
          }
        }

        return newState;
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [trainingState.isActive, isPlaying, activeMode, songLength, incrementalTempo, mutePattern, timeSignature.numerator]);

  // Callback registration functions
  const registerBPMChangeCallback = useCallback((callback: (newBPM: number) => void) => {
    onBPMChange.current = callback;
  }, []);

  const registerStopCallback = useCallback((callback: () => void) => {
    onStop.current = callback;
  }, []);

  // Generate status text
  const getStatusText = useCallback((): string => {
    if (activeMode === 'none' || !trainingState.isActive) return '';

    const parts: string[] = [];

    if (activeMode === 'songLength') {
      if (songLength.mode === 'bars') {
        parts.push(`${trainingState.currentBar}/${songLength.bars} 마디`);
      } else if (songLength.mode === 'duration') {
        const remaining = songLength.duration - trainingState.elapsedTime;
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        parts.push(`${minutes}:${seconds.toString().padStart(2, '0')} 남음`);
      }
    }

    if (activeMode === 'incrementalTempo') {
      parts.push(`${trainingState.currentBPM} BPM`);
    }

    if (activeMode === 'mutePattern') {
      parts.push(trainingState.isMuted ? '무음 구간' : '소리 구간');
    }

    return parts.join(' • ');
  }, [activeMode, trainingState, songLength, mutePattern]);

  // Check mute status (for external use)
  const isMuted = trainingState.isMuted && activeMode === 'mutePattern';

  return {
    // State
    activeMode,
    songLength,
    incrementalTempo,
    mutePattern,
    trainingState,
    isMuted,

    // Actions
    setActiveMode,
    setSongLengthSettings,
    setIncrementalTempoSettings,
    setMutePatternSettings,

    // Utilities
    getStatusText,
    registerBPMChangeCallback,
    registerStopCallback
  };
};