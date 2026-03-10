import React, { useState } from 'react';
import WaveIcon from '../assets/icons/wave.svg?react';
import TimerIcon from '../assets/icons/timer.svg?react';
import TempoStepIcon from '../assets/icons/tempo-step.svg?react';
import MutePatternIcon from '../assets/icons/mute-pattern.svg?react';

export type RhythmTrainingMode = 'none' | 'songLength' | 'incrementalTempo' | 'mutePattern';

interface RhythmTrainingButtonProps {
  onClick?: () => void;
  isDisabled?: boolean;
  activeMode?: RhythmTrainingMode;
}

const RhythmTrainingButton: React.FC<RhythmTrainingButtonProps> = ({
  onClick,
  isDisabled = false,
  activeMode = 'none'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isDisabled) return;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
    onClick?.();
  };

  // Select icon based on active mode
  const getIcon = () => {
    const iconProps = { width: 28, height: 28 };
    
    switch (activeMode) {
      case 'songLength':
        return <TimerIcon {...iconProps} />;
      case 'incrementalTempo':
        return <TempoStepIcon {...iconProps} />;
      case 'mutePattern':
        return <MutePatternIcon {...iconProps} />;
      default:
        return <WaveIcon {...iconProps} />;
    }
  };

  // Trigger animation when mode changes
  React.useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 400);
    return () => clearTimeout(timer);
  }, [activeMode]);

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className="metronome-control-button"
      aria-label="Rhythm training"
      style={{
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        padding: 0,
        position: 'relative',
        fontFamily: 'var(--FONT_FAMILY)',
        color: 'var(--text-primary)',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        transform: isAnimating ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isAnimating ? '0 4px 12px rgba(243, 111, 99, 0.15)' : 'none'
      }}
    >
      <div 
        style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? 'scale(0.5)' : 'scale(1)',
          transition: 'opacity 0.2s ease, transform 0.2s ease'
        }}
      >
        {getIcon()}
      </div>
    </button>
  );
};

export default RhythmTrainingButton;