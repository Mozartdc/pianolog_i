// src/components/SongLengthSettings.tsx

import React, { useState } from 'react';
import { SongLengthSettings } from './useRhythmTraining';
import RollingPicker from './RollingPicker';

interface SongLengthSettingsProps {
  settings: SongLengthSettings;
  onChange: (settings: SongLengthSettings) => void;
}

const SongLengthSettingsComponent: React.FC<SongLengthSettingsProps> = ({
  settings,
  onChange
}) => {
  const [selectedMode, setSelectedMode] = useState(settings.mode);
  const [barsValue, setBarsValue] = useState(settings.bars);
  const [durationValue, setDurationValue] = useState(settings.duration);

  // Bar options (1-100)
  const barsOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  // Time options (0-99 minutes, 0-59 seconds)
  const minutesOptions = Array.from({ length: 100 }, (_, i) => i);
  const secondsOptions = Array.from({ length: 60 }, (_, i) => i);

  // Convert current time to minutes/seconds
  const currentMinutes = Math.floor(durationValue / 60);
  const currentSeconds = durationValue % 60;

  const handleModeChange = (mode: 'off' | 'bars' | 'duration') => {
    setSelectedMode(mode);
    onChange({
      ...settings,
      mode
    });
  };

  const handleBarsChange = (index: number) => {
    const newBars = barsOptions[index];
    setBarsValue(newBars);
    onChange({
      ...settings,
      bars: newBars
    });
  };

  const handleMinutesChange = (index: number) => {
    const newMinutes = minutesOptions[index];
    const newDuration = newMinutes * 60 + currentSeconds;
    setDurationValue(newDuration);
    onChange({
      ...settings,
      duration: newDuration
    });
  };

  const handleSecondsChange = (index: number) => {
    const newSeconds = secondsOptions[index];
    const newDuration = currentMinutes * 60 + newSeconds;
    setDurationValue(newDuration);
    onChange({
      ...settings,
      duration: newDuration
    });
  };

  const getBarsIndex = () => barsOptions.findIndex(bars => bars === barsValue);
  const getMinutesIndex = () => minutesOptions.findIndex(min => min === currentMinutes);
  const getSecondsIndex = () => secondsOptions.findIndex(sec => sec === currentSeconds);

  // Settings summary text
  const getSummaryText = () => {
    if (selectedMode === 'off') return '비활성화';
    if (selectedMode === 'bars') return `${barsValue}마디 후 자동 정지`;
    if (selectedMode === 'duration') {
      if (durationValue === 0) return '0분 0초 (즉시 정지)';
      return `${Math.floor(durationValue / 60)}분 ${durationValue % 60}초 후 자동 정지`;
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
        연습 길이 설정
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
          <div style={{
            fontSize: '12px',
            color: 'var(--text-primary)',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            마디 수
          </div>
          <div style={{ height: '200px', width: '100px' }}>
            <RollingPicker
              values={barsOptions}
              selectedIndex={getBarsIndex()}
              onChange={handleBarsChange}
              height={200}
              itemHeight={40}
              fontSize="16px"
              fontWeight="500"
              fontFamily="var(--FONT_FAMILY)"
              textColor="var(--text-primary)"
              selectedColor="var(--text-primary)"
            />
          </div>
        </div>
      )}

      {/* Time-based settings */}
      {selectedMode === 'duration' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-primary)',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            시간 설정
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px'
          }}>
            {/* Minutes picker */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                분
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={minutesOptions}
                  selectedIndex={getMinutesIndex()}
                  onChange={handleMinutesChange}
                  height={200}
                  itemHeight={40}
                  fontSize="16px"
                  fontWeight="500"
                  fontFamily="var(--FONT_FAMILY)"
                  textColor="var(--text-primary)"
                  selectedColor="var(--text-primary)"
                />
              </div>
            </div>

            {/* Separator */}
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              margin: '20px 8px 0 8px'
            }}>
              :
            </div>

            {/* Seconds picker */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                초
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={secondsOptions}
                  selectedIndex={getSecondsIndex()}
                  onChange={handleSecondsChange}
                  height={200}
                  itemHeight={40}
                  fontSize="16px"
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

export default SongLengthSettingsComponent;
