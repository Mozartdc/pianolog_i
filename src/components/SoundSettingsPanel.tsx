import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSoundEngine } from './useSoundEngine';
import { MetronomeSoundEngine } from './MetronomeSoundEngine';
import {
  SoundSettings,
  DEFAULT_SOUND_SETTINGS,
  SoundCategory
} from './soundTypes';
import SoundToggleOnIcon from '../assets/icons/MS_sound_go.svg?react';
import SoundToggleMuteIcon from '../assets/icons/MS_sound_mute.svg?react';
import FlashOnIcon from '../assets/icons/MS_flash_on.svg?react';
import FlashOffIcon from '../assets/icons/MS_flash_off.svg?react';
import VolumeOffIcon from '../assets/icons/MS_sound_off.svg?react';
import VolumeOnIcon from '../assets/icons/MS_sound_on.svg?react';
import AccentOneIcon from '../assets/icons/MS_accent_1x.svg?react';
import AccentTwoIcon from '../assets/icons/MS_accent_2x.svg?react';
import WoodIcon from '../assets/icons/MS_wood.svg?react';
import PercussionIcon from '../assets/icons/MS_percussion.svg?react';
import DigitalIcon from '../assets/icons/MS_digital.svg?react';
import MechanicalIcon from '../assets/icons/MS_mechanical.svg?react';
import MarimbaIcon from '../assets/icons/MS_marimba.svg?react';
import './SoundSettingsPanel.css';

const FLASH_STORAGE_KEY = 'metronome.fullscreenFlashEnabled';
const SOUND_STORAGE_KEY = 'metronome.soundEnabled';
const SOUND_SETTINGS_STORAGE_KEY = 'metronome.soundSettings.v1';

const loadStoredSoundSettings = (): SoundSettings => {
  if (typeof window === 'undefined') return DEFAULT_SOUND_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SOUND_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SOUND_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SoundSettings>;
    return {
      ...DEFAULT_SOUND_SETTINGS,
      ...parsed
    };
  } catch {
    return DEFAULT_SOUND_SETTINGS;
  }
};

const CATEGORY_ICONS: Record<SoundCategory, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  wood: WoodIcon,
  percussion: PercussionIcon,
  digital: DigitalIcon,
  mechanical: MechanicalIcon,
  marimba: MarimbaIcon
};

const SOUND_OPTIONS: Array<{
  category: SoundCategory;
  label: string;
  presetId: string;
}> = [
  { category: 'mechanical', label: '기계식', presetId: 'mechanical' },
  { category: 'wood', label: '우드 블럭', presetId: 'wood_block' },
  { category: 'marimba', label: '마림바', presetId: 'marimba' },
  { category: 'digital', label: '디지털', presetId: 'beep' },
  { category: 'percussion', label: '퍼커션', presetId: 'shaker' }
];

interface SoundSettingsPanelProps {
  onFullScreenFlashEnabledChange?: (enabled: boolean) => void;
}

const SoundSettingsPanel: React.FC<SoundSettingsPanelProps> = ({
  onFullScreenFlashEnabledChange
}) => {
  const engineSnapshot = useMemo(
    () => MetronomeSoundEngine.getInstance().getCurrentSettingsSnapshot(),
    []
  );
  const {
    isInitialized,
    initialize,
    applySettings,
    preview,
    stopAll
  } = useSoundEngine();

  const [settings, setSettings] = useState<SoundSettings>(() => {
    const stored = loadStoredSoundSettings();
    if (engineSnapshot) {
      return { ...stored, ...engineSnapshot };
    }
    return stored;
  });
  const [localSettings, setLocalSettings] = useState<SoundSettings>(() => {
    const stored = loadStoredSoundSettings();
    if (engineSnapshot) {
      return { ...stored, ...engineSnapshot };
    }
    return stored;
  });
  const [previewingPresetId, setPreviewingPresetId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return DEFAULT_SOUND_SETTINGS.volume > 0;
    const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored === null) return DEFAULT_SOUND_SETTINGS.volume > 0;
    return stored === '1';
  });
  const [fullScreenFlashEnabled, setFullScreenFlashEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(FLASH_STORAGE_KEY) === '1';
  });

  const previewStateTimerRef = useRef<number | null>(null);
  const previousVolumeRef = useRef<number>(DEFAULT_SOUND_SETTINGS.volume);

  const debouncedApply = useMemo(() => {
    let timer: number;
    return (newSettings: SoundSettings) => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        setSettings(newSettings);
      }, 80);
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  useEffect(() => {
    if (!isInitialized) return;
    const latest = {
      ...loadStoredSoundSettings(),
      ...MetronomeSoundEngine.getInstance().getCurrentSettingsSnapshot()
    };
    setSettings(latest);
    setLocalSettings(latest);
  }, [isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      applySettings(settings);
    }
  }, [settings, isInitialized, applySettings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, JSON.stringify(localSettings));
  }, [localSettings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FLASH_STORAGE_KEY, fullScreenFlashEnabled ? '1' : '0');
    }
    onFullScreenFlashEnabledChange?.(fullScreenFlashEnabled);
  }, [fullScreenFlashEnabled, onFullScreenFlashEnabledChange]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? '1' : '0');
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (localSettings.volume > 0) {
      previousVolumeRef.current = localSettings.volume;
      if (!soundEnabled) {
        setSoundEnabled(true);
      }
      return;
    }
    if (localSettings.volume === 0 && soundEnabled) {
      setSoundEnabled(false);
    }
  }, [localSettings.volume, soundEnabled]);

  useEffect(() => {
    return () => {
      if (previewStateTimerRef.current !== null) {
        window.clearTimeout(previewStateTimerRef.current);
      }
    };
  }, []);

  const handleSettingChange = useCallback(<K extends keyof SoundSettings>(
    key: K,
    value: SoundSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    debouncedApply(newSettings);
  }, [localSettings, debouncedApply]);

  const handlePresetPreview = useCallback(async (presetId: string) => {
    if (!isInitialized) return;

    const selectedSettingsSnapshot = { ...localSettings };
    const previewSettings = { ...localSettings, presetId };
    setPreviewingPresetId(presetId);

    stopAll();
    applySettings(previewSettings);
    await preview({ type: 'pattern', bars: 1 });

    if (previewStateTimerRef.current !== null) {
      window.clearTimeout(previewStateTimerRef.current);
    }
    previewStateTimerRef.current = window.setTimeout(() => {
      setPreviewingPresetId(null);
      applySettings(selectedSettingsSnapshot);
    }, 400);
  }, [isInitialized, localSettings, stopAll, applySettings, preview]);

  const handleSoundToggle = useCallback(() => {
    if (soundEnabled) {
      if (localSettings.volume > 0) {
        previousVolumeRef.current = localSettings.volume;
      }
      handleSettingChange('volume', 0);
      setSoundEnabled(false);
      return;
    }
    const restoredVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : DEFAULT_SOUND_SETTINGS.volume;
    handleSettingChange('volume', restoredVolume);
    setSoundEnabled(true);
  }, [soundEnabled, localSettings.volume, handleSettingChange]);

  return (
    <div className="sound-settings-panel">
      <section className="sound-settings-section">
        <div className="sound-settings-header">
          <h2 className="sound-settings-main-title">메트로놈 세팅</h2>
        </div>
      </section>

      <section className="sound-settings-section">
        <div className="sound-settings-top-row">
          <div className="top-toggle-group sound-group">
            <span className="sound-settings-title-inline">사운드</span>
            <button type="button" className="sound-flash-button" onClick={handleSoundToggle} aria-label="사운드 토글">
              {soundEnabled ? (
                <SoundToggleOnIcon className="top-toggle-icon is-on" />
              ) : (
                <SoundToggleMuteIcon className="top-toggle-icon" />
              )}
            </button>
          </div>
          <div className="top-toggle-group flash-group">
            <span className="sound-settings-title-inline">전체 화면 플래시</span>
            <button type="button" className="sound-flash-button" onClick={() => setFullScreenFlashEnabled((prev) => !prev)} aria-label="전체 화면 플래시 토글">
              {fullScreenFlashEnabled ? (
                <FlashOnIcon className="top-toggle-icon is-on" />
              ) : (
                <FlashOffIcon className="top-toggle-icon" />
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="sound-settings-section">
        <h3 className="sound-settings-title">마스터 볼륨</h3>
        <div className="slider-row">
          <VolumeOffIcon className={`slider-icon ${localSettings.volume === 0 ? 'is-active' : ''}`} />
          <input
            className="sound-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={localSettings.volume}
            onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
            style={{
              background: `linear-gradient(to right, var(--LIVING_CORAL) ${localSettings.volume * 100}%, var(--DARK_GRAY) ${localSettings.volume * 100}%)`
            }}
          />
          <VolumeOnIcon className={`slider-icon ${localSettings.volume > 0 ? 'is-active' : ''}`} />
          <span className="slider-value">{Math.round(localSettings.volume * 100)}%</span>
        </div>
      </section>

      <section className="sound-settings-section">
        <h3 className="sound-settings-title">악센트 볼륨</h3>
        <div className="slider-row">
          <AccentOneIcon className="slider-icon is-active" />
          <input
            className="sound-slider"
            type="range"
            min={1}
            max={2}
            step={0.1}
            value={localSettings.accentGain}
            onChange={(e) => handleSettingChange('accentGain', parseFloat(e.target.value))}
            style={{
              background: `linear-gradient(to right, var(--LIVING_CORAL) ${(localSettings.accentGain - 1) * 100}%, var(--DARK_GRAY) ${(localSettings.accentGain - 1) * 100}%)`
            }}
          />
          <AccentTwoIcon className="slider-icon is-active" />
          <span className="slider-value">{localSettings.accentGain.toFixed(1)}x</span>
        </div>
      </section>

      <section className="sound-settings-section">
        <h3 className="sound-settings-title">사운드 선택</h3>
        <div className="sound-preset-list">
          {SOUND_OPTIONS.map((option) => {
            const Icon = CATEGORY_ICONS[option.category];
            const selected = localSettings.presetId === option.presetId;
            const previewing = previewingPresetId === option.presetId;
            return (
              <div key={option.presetId} className={`sound-preset-row ${selected ? 'is-selected' : ''}`}>
                <button type="button" className="sound-preset-main" onClick={() => handleSettingChange('presetId', option.presetId)}>
                  <span className="sound-preset-left">
                    <Icon className="sound-category-icon" />
                    <span className="sound-preset-name">{option.label}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`sound-preset-play ${previewing ? 'is-playing' : ''}`}
                  onClick={() => handlePresetPreview(option.presetId)}
                  aria-label={`${option.label} 재생`}
                >
                  <VolumeOnIcon />
                </button>
                <span className={`sound-preset-selected ${selected ? 'is-selected' : ''}`}>
                  <span>✓</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default SoundSettingsPanel;
