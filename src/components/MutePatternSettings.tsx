// src/components/MutePatternSettings.tsx

import React, { useState } from 'react';
import { MutePatternSettings } from './useRhythmTraining';
import RollingPicker from './RollingPicker';

interface MutePatternSettingsProps {
  settings: MutePatternSettings;
  onChange: (settings: MutePatternSettings) => void;
}

const MutePatternSettingsComponent: React.FC<MutePatternSettingsProps> = ({
  settings,
  onChange
}) => {
  const [selectedMode, setSelectedMode] = useState(settings.mode);

  // Bars options (1-99)
  const barsOptions = Array.from({ length: 99 }, (_, i) => i + 1);

  // Seconds options (1-99 seconds)
  const secondsOptions = Array.from({ length: 99 }, (_, i) => i + 1);

  const handleModeChange = (mode: 'off' | 'bars' | 'duration') => {
    setSelectedMode(mode);
    onChange({
      ...settings,
      mode
    });
  };

  // Bar-based handlers
  const handleBarsSoundLengthChange = (index: number) => {
    const newSoundLength = barsOptions[index];
    onChange({
      ...settings,
      bars: { ...settings.bars, soundLength: newSoundLength }
    });
  };

  const handleBarsMuteLengthChange = (index: number) => {
    const newMuteLength = barsOptions[index];
    onChange({
      ...settings,
      bars: { ...settings.bars, muteLength: newMuteLength }
    });
  };

  // Time-based handlers
  const handleDurationSoundLengthChange = (index: number) => {
    const newSoundLength = secondsOptions[index];
    onChange({
      ...settings,
      duration: { ...settings.duration, soundLength: newSoundLength }
    });
  };

  const handleDurationMuteLengthChange = (index: number) => {
    const newMuteLength = secondsOptions[index];
    onChange({
      ...settings,
      duration: { ...settings.duration, muteLength: newMuteLength }
    });
  };

  // Index calculation functions
  const getBarsSoundLengthIndex = () => barsOptions.findIndex(bars => bars === settings.bars.soundLength);
  const getBarsMuteLengthIndex = () => barsOptions.findIndex(bars => bars === settings.bars.muteLength);
  const getDurationSoundLengthIndex = () => secondsOptions.findIndex(sec => sec === settings.duration.soundLength);
  const getDurationMuteLengthIndex = () => secondsOptions.findIndex(sec => sec === settings.duration.muteLength);

  // Settings summary text
  const getSummaryText = () => {
    if (selectedMode === 'off') return '비활성화';
    
    if (selectedMode === 'bars') {
      return `${settings.bars.soundLength}마디 소리 → ${settings.bars.muteLength}마디 무음 반복`;
    }
    
    if (selectedMode === 'duration') {
      return `${settings.duration.soundLength}초 소리 → ${settings.duration.muteLength}초 무음 반복`;
    }
    
    return '';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '10px 16px 0 16px'
    }}>
      {/* Title */}
      <div style={{
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        textAlign: 'center',
        marginBottom: '10px'
      }}>
        음소거 구간 설정
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        width: '340px',
        height: '30px',
        alignSelf: 'center',
        marginBottom: '20px'
      }}>
        {[
          { key: 'off', label: 'OFF' },
          { key: 'bars', label: '마디 기준' },
          { key: 'duration', label: '시간 기준' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleModeChange(tab.key as 'off' | 'bars' | 'duration')}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              fontSize: '12px',
              fontFamily: 'var(--FONT_FAMILY)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: selectedMode === tab.key ? 'var(--LIVING_CORAL)' : 'var(--DARK_GRAY)',
              color: selectedMode === tab.key ? 'var(--button-primary-text)' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bar-based settings */}
      {selectedMode === 'bars' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* 2 parameters laid out horizontally */}
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start',
            justifyContent: 'center'
          }}>
            {/* Sound section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Sound On
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={barsOptions}
                  selectedIndex={getBarsSoundLengthIndex()}
                  onChange={handleBarsSoundLengthChange}
                  height={200}
                  itemHeight={40}
                  fontSize="14px"
                  fontWeight="500"
                  fontFamily="var(--FONT_FAMILY)"
                  textColor="var(--text-primary)"
                  selectedColor="var(--text-primary)"
                />
              </div>
            </div>

            {/* Mute section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Mute
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={barsOptions}
                  selectedIndex={getBarsMuteLengthIndex()}
                  onChange={handleBarsMuteLengthChange}
                  height={200}
                  itemHeight={40}
                  fontSize="14px"
                  fontWeight="500"
                  fontFamily="var(--FONT_FAMILY)"
                  textColor="var(--text-primary)"
                  selectedColor="var(--text-primary)"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time-based settings */}
      {selectedMode === 'duration' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* 2 parameters laid out horizontally */}
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start',
            justifyContent: 'center'
          }}>
            {/* Sound section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Sound On
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={secondsOptions}
                  selectedIndex={getDurationSoundLengthIndex()}
                  onChange={handleDurationSoundLengthChange}
                  height={200}
                  itemHeight={40}
                  fontSize="14px"
                  fontWeight="500"
                  fontFamily="var(--FONT_FAMILY)"
                  textColor="var(--text-primary)"
                  selectedColor="var(--text-primary)"
                />
              </div>
            </div>

            {/* Mute section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Mute
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={secondsOptions}
                  selectedIndex={getDurationMuteLengthIndex()}
                  onChange={handleDurationMuteLengthChange}
                  height={200}
                  itemHeight={40}
                  fontSize="14px"
                  fontWeight="500"
                  fontFamily="var(--FONT_FAMILY)"
                  textColor="var(--text-primary)"
                  selectedColor="var(--text-primary)"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MutePatternSettingsComponent;
