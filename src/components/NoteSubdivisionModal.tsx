// src/components/NoteSubdivisionModal.tsx - Hooks error fix

import React, { useRef, useEffect, useState } from 'react';
import { renderRhythm, RHYTHM_PATTERNS } from '../utils/rhythmUtils';
import RollingPicker from './RollingPicker';
import OkIcon from '../assets/icons/ok.svg?react';
import { useMetronomeStore } from './useMetronomeStore';

interface NoteSubdivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (rhythmId: string) => void;
  anchorTop?: number;
  currentRhythmId?: string;
}

// Separated into individual component to fix hook errors
const RhythmPatternItem: React.FC<{
  pattern: typeof RHYTHM_PATTERNS[0];
  timeSignatureDenominator: number;
}> = React.memo(({ pattern, timeSignatureDenominator }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      renderRhythm(
        containerRef.current,
        pattern.id,
        timeSignatureDenominator,
        48,
        32
      );
    }
  }, [pattern.id, timeSignatureDenominator]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80px',
        padding: '8px'
      }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '64px',
          padding: '8px'
        }}
      >
        <div 
          className="picker-item"
          ref={containerRef} 
          style={{ 
            width: '40px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} 
        />
      </div>
    </div>
  );
});

const NoteSubdivisionModal: React.FC<NoteSubdivisionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  anchorTop = 230,
  currentRhythmId = 'one_beat'
}) => {
  const { timeSignature } = useMetronomeStore();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const index = RHYTHM_PATTERNS.findIndex(p => p.id === currentRhythmId);
    if (index !== -1) {
      setSelectedIndex(index);
    }
  }, [currentRhythmId]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelectionChange = (index: number) => {
    setSelectedIndex(index);
    const selectedPattern = RHYTHM_PATTERNS[index];
    if (selectedPattern) {
      onSelect?.(selectedPattern.id);
    }
  };

  const handleConfirm = () => {
    const selectedPattern = RHYTHM_PATTERNS[selectedIndex];
    if (selectedPattern) {
      onSelect?.(selectedPattern.id);
    }
    onClose();
  };

  // Changed renderItem function to component to fix hook issues
  const renderPickerItem = (pattern: typeof RHYTHM_PATTERNS[0], index: number) => {
    return (
      <RhythmPatternItem 
        key={`${pattern.id}-${timeSignature.denominator}-${index}`}
        pattern={pattern}
        timeSignatureDenominator={timeSignature.denominator}
      />
    );
  };

  if (!isOpen) return null;

  return (
    <>
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
          padding: '24px',
          paddingBottom: '100px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.2)',
          animation: 'slideUp 0.3s ease-out',
          fontFamily: 'var(--FONT_FAMILY)',
          overflowY: 'hidden'
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

        {/* Rolling picker */}
        <div style={{ height: '240px', marginBottom: '32px' }}>
          <style>
            {`
              .picker-item { 
                width: 40px;
                height: 24px;
                display: flex; 
                align-items: center; 
                justify-content: center;
              }
              .picker-item > svg {
                display: block;
                width: 100%;
                height: 100%;
                pointer-events: none;
              }
            `}
          </style>
          <RollingPicker
            values={RHYTHM_PATTERNS}
            selectedIndex={selectedIndex}
            onChange={handleSelectionChange}
            height={240}
            itemHeight={64}
            renderItem={renderPickerItem}
            fontSize="12px"
            fontWeight="500"
            fontFamily="var(--FONT_FAMILY)"
            textColor="var(--text-secondary)"
            selectedColor="var(--text-primary)"
          />
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
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            transition: 'all 0.2s ease',
            padding: '0'
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

export default NoteSubdivisionModal;