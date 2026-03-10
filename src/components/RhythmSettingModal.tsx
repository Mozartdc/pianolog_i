// src/components/RhythmSettingModal.tsx

import React from 'react';
import { 
  RhythmTrainingMode, 
  SongLengthSettings, 
  IncrementalTempoSettings, 
  MutePatternSettings 
} from './useRhythmTraining';
import SongLengthSettingsComponent from './SongLengthSettings';
import IncrementalTempoSettingsComponent from './IncrementalTempoSettings';
import MutePatternSettingsComponent from './MutePatternSettings';
import OkIcon from '../assets/icons/ok.svg?react';

interface RhythmSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: RhythmTrainingMode;
  songLengthSettings: SongLengthSettings;
  incrementalTempoSettings: IncrementalTempoSettings;
  mutePatternSettings: MutePatternSettings;
  onSongLengthChange: (settings: SongLengthSettings) => void;
  onIncrementalTempoChange: (settings: IncrementalTempoSettings) => void;
  onMutePatternChange: (settings: MutePatternSettings) => void;
  currentBPM: number;
  anchorTop?: number;
}

const RhythmSettingModal: React.FC<RhythmSettingModalProps> = ({
  isOpen,
  onClose,
  mode,
  songLengthSettings,
  incrementalTempoSettings,
  mutePatternSettings,
  onSongLengthChange,
  onIncrementalTempoChange,
  onMutePatternChange,
  currentBPM,
  anchorTop = 230
}) => {
  if (!isOpen || mode === 'none') return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onClose();
  };

  const renderSettingsComponent = () => {
    switch (mode) {
      case 'songLength':
        return (
          <SongLengthSettingsComponent
            settings={songLengthSettings}
            onChange={onSongLengthChange}
          />
        );
      case 'incrementalTempo':
        return (
          <IncrementalTempoSettingsComponent
            settings={incrementalTempoSettings}
            onChange={onIncrementalTempoChange}
            currentBPM={currentBPM}
          />
        );
      case 'mutePattern':
        return (
          <MutePatternSettingsComponent
            settings={mutePatternSettings}
            onChange={onMutePatternChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={handleBackdropClick}
      />
      
      {/* Modal container */}
      <div
        style={{
          position: 'fixed',
          top: `${anchorTop + 50}px`,
          left: '16px',
          right: '16px',
          width: 'calc(100% - 32px)',
          bottom: 0,
          backgroundColor: 'var(--bg-primary)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          zIndex: 1000,
          padding: '16px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.2)',
          animation: 'slideUp 0.3s ease-out',
          fontFamily: 'var(--FONT_FAMILY)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '2px',
            margin: '0 auto 24px auto'
          }}
        />

        {/* Scrollable settings content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: '8px'
          }}
        >
          {renderSettingsComponent()}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            height: '50px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--FONT_FAMILY)',
            fontSize: '14px', // Changed to 14px to match design specs
            fontWeight: '700',
            color: 'var(--text-primary)',
            transition: 'all 0.2s ease',
            padding: '0',
            marginTop: '12px',
            marginBottom: 'max(6px, env(safe-area-inset-bottom))',
            flexShrink: 0
          }}
        >
          <OkIcon width={24} height={24} />
          <span>확인</span>
        </button>

        <style>
          {`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default RhythmSettingModal;
