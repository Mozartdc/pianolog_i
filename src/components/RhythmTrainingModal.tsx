// src/components/RhythmTrainingModal.tsx

import React from 'react';
import { RhythmTrainingMode } from './useRhythmTraining';
import TimerIcon from '../assets/icons/timer.svg?react';
import TempoStepIcon from '../assets/icons/tempo-step.svg?react';
import MutePatternIcon from '../assets/icons/mute-pattern.svg?react';

interface RhythmTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: RhythmTrainingMode) => void;
  anchorTop?: number;
}

interface TrainingOption {
  id: RhythmTrainingMode;
  title: string;
  icon: React.ComponentType<{ width: number; height: number }>;
}

const trainingOptions: TrainingOption[] = [
  {
    id: 'songLength',
    title: '연습 길이 설정',
    icon: TimerIcon
  },
  {
    id: 'incrementalTempo',
    title: '증분 템포 변경',
    icon: TempoStepIcon
  },
  {
    id: 'mutePattern',
    title: '음소거 구간 설정',
    icon: MutePatternIcon
  }
];

const RhythmTrainingModal: React.FC<RhythmTrainingModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  anchorTop = 230
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleOptionSelect = (mode: RhythmTrainingMode) => {
    onSelectMode(mode);
    // Removed onClose() - handled by parent
  };

  const handleDisableTraining = () => {
    onSelectMode('none');
    onClose();
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
          backgroundColor: 'transparent',
          zIndex: 1500 // Higher z-index
        }}
        onClick={handleBackdropClick}
      />
      
      {/* Small popup modal */}
      <div
        style={{
          position: 'fixed',
          top: `${anchorTop + 60}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '280px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          zIndex: 1501, // Higher z-index
          animation: 'popupScale 0.2s ease-out',
          fontFamily: 'var(--FONT_FAMILY)',
          border: '1px solid var(--DARK_GRAY)'
        }}
      >
        {/* Option list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {trainingOptions.map((option) => {
            const IconComponent = option.icon;
            
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--FONT_FAMILY)',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f8f9fa)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--TURQUOISE)',
                  flexShrink: 0
                }}>
                  <IconComponent width={20} height={20} />
                </div>

                {/* Title */}
                <span style={{ flex: 1 }}>
                  {option.title}
                </span>
              </button>
            );
          })}
          
          {/* Divider */}
          <div style={{
            height: '1px',
            backgroundColor: 'var(--DARK_GRAY)',
            margin: '4px 0',
            opacity: 0.3
          }} />
          
          {/* Disable button */}
          <button
            onClick={handleDisableTraining}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              background: 'none',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--FONT_FAMILY)',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f8f9fa)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            트레이닝 모드 비활성화
          </button>
        </div>

        <style>
          {`
            @keyframes popupScale {
              from {
                opacity: 0;
                transform: translateX(-50%) scale(0.9);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) scale(1);
              }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default RhythmTrainingModal;
