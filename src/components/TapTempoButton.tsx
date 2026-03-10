import React, { useState } from 'react';

interface TapTempoButtonProps {
  onClick?: () => void;
  isDisabled?: boolean;
}

const TapTempoButton: React.FC<TapTempoButtonProps> = ({
  onClick,
  isDisabled = false
}) => {
  const [isToggled, setIsToggled] = useState(false);

  const handleClick = () => {
    if (isDisabled) return;
    
    setIsToggled(!isToggled);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className="metronome-control-button"
      aria-label="탭 템포"
      aria-pressed={isToggled}
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
        className="tap-container"
        style={{
          position: 'relative',
          width: '30px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Default state shows "tap" */}
        <span
          className={`tap-text default ${!isToggled ? 'visible' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !isToggled ? 1 : 0,
            transform: !isToggled ? 'scale(1)' : 'scale(0.5)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            userSelect: 'none'
          }}
          aria-hidden="true"
        >
          tap
        </span>
        
        {/* Toggled state also shows "tap" */}
        <span
          className={`tap-text toggled ${isToggled ? 'visible' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isToggled ? 1 : 0,
            transform: isToggled ? 'scale(1)' : 'scale(0.5)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            userSelect: 'none'
          }}
          aria-hidden="true"
        >
          tap
        </span>
      </div>
    </button>
  );
};

export default TapTempoButton;