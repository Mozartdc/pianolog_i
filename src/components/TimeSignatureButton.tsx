import React, { useState } from 'react';
import { TimeSignature } from './useMetronomeStore';

interface TimeSignatureButtonProps {
  currentSignature: TimeSignature;
  onSignatureChange: (signature: TimeSignature) => void;
  onClick?: () => void;
  isDisabled?: boolean;
}

const TimeSignatureButton: React.FC<TimeSignatureButtonProps> = ({
  currentSignature,
  onSignatureChange,
  onClick,
  isDisabled = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isDisabled) return;
    onClick?.();
  };

  const getSignatureString = () => {
    return `${currentSignature.numerator}/${currentSignature.denominator}`;
  };

  // Trigger animation when time signature changes
  React.useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 400);
    return () => clearTimeout(timer);
  }, [currentSignature]);

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className="metronome-control-button"
      aria-label={`박자표: ${getSignatureString()}`}
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
        fontSize: '22.5px',
        fontWeight: '900',
        color: 'var(--text-primary)',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all 0.2s ease'
      }}
    >
      <div 
        className="signature-container"
        style={{
          position: 'relative',
          width: '35px',
          height: '25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span
          className={`signature-text ${isAnimating ? 'animating' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? 'scale(0.5)' : 'scale(1)',
            transition: 'opacity 0.2s ease, transform 0.2s ease'
          }}
        >
          {getSignatureString()}
        </span>
      </div>
    </button>
  );
};

export default TimeSignatureButton;