// src/components/IncrementalTempoSettings.tsx

import React, { useState } from 'react';
import { IncrementalTempoSettings } from './useRhythmTraining';
import RollingPicker from './RollingPicker';

interface IncrementalTempoSettingsProps {
  settings: IncrementalTempoSettings;
  onChange: (settings: IncrementalTempoSettings) => void;
  currentBPM: number;
}

const IncrementalTempoSettingsComponent: React.FC<IncrementalTempoSettingsProps> = ({
  settings,
  onChange,
  currentBPM
}) => {
  const [selectedMode, setSelectedMode] = useState(settings.mode);

  // BPM increment/decrement options (-40 ~ +40)
  const stepOptions = Array.from({ length: 81 }, (_, i) => i - 40);

  // Bar interval options (1-99)
  const barsIntervalOptions = Array.from({ length: 99 }, (_, i) => i + 1);

  // Time interval options (5sec-200sec, in 5sec increments)
  const durationIntervalOptions = Array.from({ length: 40 }, (_, i) => (i + 1) * 5);

  // Limit BPM options (20 ~ current BPM * 2, current BPM as default)
  const maxLimit = Math.max(currentBPM * 2, 400);
  const limitOptions = Array.from({ length: maxLimit - 19 }, (_, i) => i + 20);

  const handleModeChange = (mode: 'off' | 'bars' | 'duration') => {
    setSelectedMode(mode);
    onChange({
      ...settings,
      mode
    });
  };

  const handleBarsStepChange = (index: number) => {
    const newStep = stepOptions[index];
    onChange({
      ...settings,
      bars: { ...settings.bars, step: newStep }
    });
  };

  const handleBarsIntervalChange = (index: number) => {
    const newInterval = barsIntervalOptions[index];
    onChange({
      ...settings,
      bars: { ...settings.bars, interval: newInterval }
    });
  };

  const handleBarsLimitChange = (index: number) => {
    const newLimit = limitOptions[index];
    onChange({
      ...settings,
      bars: { ...settings.bars, limit: newLimit }
    });
  };

  const handleDurationStepChange = (index: number) => {
    const newStep = stepOptions[index];
    onChange({
      ...settings,
      duration: { ...settings.duration, step: newStep }
    });
  };

  const handleDurationIntervalChange = (index: number) => {
    const newInterval = durationIntervalOptions[index];
    onChange({
      ...settings,
      duration: { ...settings.duration, interval: newInterval }
    });
  };

  const handleDurationLimitChange = (index: number) => {
    const newLimit = limitOptions[index];
    onChange({
      ...settings,
      duration: { ...settings.duration, limit: newLimit }
    });
  };

  // Index calculation functions
  const getBarsStepIndex = () => stepOptions.findIndex(step => step === settings.bars.step);
  const getBarsIntervalIndex = () => barsIntervalOptions.findIndex(interval => interval === settings.bars.interval);
  const getBarsLimitIndex = () => limitOptions.findIndex(limit => limit === settings.bars.limit);
  const getDurationStepIndex = () => stepOptions.findIndex(step => step === settings.duration.step);
  const getDurationIntervalIndex = () => durationIntervalOptions.findIndex(interval => interval === settings.duration.interval);
  const getDurationLimitIndex = () => limitOptions.findIndex(limit => limit === settings.duration.limit);

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
        증분 템포 변경
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
          {/* 3 parameters laid out horizontally */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
            justifyContent: 'center'
          }}>
            {/* Increment amount */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Increment
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={stepOptions}
                  selectedIndex={getBarsStepIndex()}
                  onChange={handleBarsStepChange}
                  height={200}
                  itemHeight={40}
                  renderItem={(step) => (
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'inherit'
                    }}>
                      {step > 0 ? '+' : ''}{step}
                    </div>
                  )}
                  fontSize="14px"
                  fontWeight="500"
                  fontFamily="var(--FONT_FAMILY)"
                  textColor="var(--text-primary)"
                  selectedColor="var(--text-primary)"
                />
              </div>
            </div>

            {/* Interval */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Per
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={barsIntervalOptions}
                  selectedIndex={getBarsIntervalIndex()}
                  onChange={handleBarsIntervalChange}
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

            {/* Limit */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Limit
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={limitOptions}
                  selectedIndex={getBarsLimitIndex()}
                  onChange={handleBarsLimitChange}
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
          {/* 3 parameters laid out horizontally */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
            justifyContent: 'center'
          }}>
            {/* Increment amount */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Increment
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={stepOptions}
                  selectedIndex={getDurationStepIndex()}
                  onChange={handleDurationStepChange}
                  height={200}
                  itemHeight={40}
                  renderItem={(step) => (
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'inherit'
                    }}>
                      {step > 0 ? '+' : ''}{step}
                    </div>
                  )}
                  fontSize="14px"
                  fontWeight="500"
                  fontFamily="var(--FONT_FAMILY)"
                  textColor="var(--text-primary)"
                  selectedColor="var(--text-primary)"
                />
              </div>
            </div>

            {/* Interval */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Per
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={durationIntervalOptions}
                  selectedIndex={getDurationIntervalIndex()}
                  onChange={handleDurationIntervalChange}
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

            {/* Limit */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Limit
              </div>
              <div style={{ height: '200px', width: '80px' }}>
                <RollingPicker
                  values={limitOptions}
                  selectedIndex={getDurationLimitIndex()}
                  onChange={handleDurationLimitChange}
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

export default IncrementalTempoSettingsComponent;
