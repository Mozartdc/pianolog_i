// src/components/SettingsOverlay.tsx

import React from 'react';
import SoundSettingsPanel from './SoundSettingsPanel';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-primary)',
        zIndex: 2000,
        animation: 'slideInFromRight 0.3s ease-out',
        fontFamily: 'var(--FONT_FAMILY)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <style>
        {`
          @keyframes slideInFromRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}
      </style>

      {/* Header area */}
      {/* Content area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 20px 100px',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <SoundSettingsPanel />
      </div>
    </div>
  );
};

export default SettingsOverlay;
