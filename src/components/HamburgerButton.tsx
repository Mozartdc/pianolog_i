// src/components/HamburgerButton.tsx

import React from 'react';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 8px)',
        right: '20px',
        width: '44px',
        height: '44px',
        zIndex: isOpen ? 2001 : 1002,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        transition: 'transform 0.3s ease',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      aria-label={isOpen ? "Close settings" : "Open settings"}
    >
      <div 
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}
      >
        {isOpen ? (
          // X icon (with two lines)
          <>
            <div style={{
              width: '20px',
              height: '2px',
              backgroundColor: 'var(--text-primary)',
              transform: 'rotate(90deg)',
              position: 'absolute'
            }} />
            <div style={{
              width: '20px',
              height: '2px',
              backgroundColor: 'var(--text-primary)',
              position: 'absolute'
            }} />
          </>
        ) : (
          // Hamburger icon (with three lines)
          <>
            <div style={{
              width: '20px',
              height: '2px',
              backgroundColor: 'var(--text-primary)',
              transition: 'all 0.3s ease'
            }} />
            <div style={{
              width: '20px',
              height: '2px',
              backgroundColor: 'var(--text-primary)',
              transition: 'all 0.3s ease'
            }} />
            <div style={{
              width: '20px',
              height: '2px',
              backgroundColor: 'var(--text-primary)',
              transition: 'all 0.3s ease'
            }} />
          </>
        )}
      </div>
    </button>
  );
};

export default HamburgerButton;
