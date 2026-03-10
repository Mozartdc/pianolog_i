import React, { useState, useEffect } from 'react';
import RollingPicker from './RollingPicker';
import { TimeSignature } from './useMetronomeStore';
import OkIcon from '../assets/icons/ok.svg?react';

interface TimeSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSignature: TimeSignature;
  onConfirm: (signature: TimeSignature) => void;
  anchorTop?: number;
}

const TimeSignatureModal: React.FC<TimeSignatureModalProps> = ({
  isOpen,
  onClose,
  currentSignature,
  onConfirm,
  anchorTop = 230
}) => {
  const [selectedNumerator, setSelectedNumerator] = useState(currentSignature.numerator);
  const [selectedDenominator, setSelectedDenominator] = useState(currentSignature.denominator);

  // Numerator: 1-16
  const numerators = Array.from({ length: 16 }, (_, i) => i + 1);
  
  // Denominator: 1, 2, 4, 8
  const denominators = [1, 2, 4, 8];

  // Set initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedNumerator(currentSignature.numerator);
      setSelectedDenominator(currentSignature.denominator);
    }
  }, [isOpen, currentSignature]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm({
      numerator: selectedNumerator,
      denominator: selectedDenominator
    });
    onClose();
  };

  const getNumeratorIndex = () => numerators.findIndex(n => n === selectedNumerator);
  const getDenominatorIndex = () => denominators.findIndex(d => d === selectedDenominator);

  const handleNumeratorChange = (index: number) => {
    if (index >= 0 && index < numerators.length) {
      setSelectedNumerator(numerators[index]);
    }
  };

  const handleDenominatorChange = (index: number) => {
    if (index >= 0 && index < denominators.length) {
      setSelectedDenominator(denominators[index]);
    }
  };

  return (
    <>
      {/* Backdrop - button areas are transparent */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          // Make button areas transparent with mask
          WebkitMaskImage: `
            radial-gradient(circle 30px at calc(50% - 65px) 180px, transparent 100%, black 100%),
            radial-gradient(circle 30px at 50% 180px, transparent 100%, black 100%),
            radial-gradient(circle 30px at calc(50% + 65px) 180px, transparent 100%, black 100%)
          `,
          maskImage: `
            radial-gradient(circle 30px at calc(50% - 65px) 180px, transparent 100%, black 100%),
            radial-gradient(circle 30px at 50% 180px, transparent 100%, black 100%),
            radial-gradient(circle 30px at calc(50% + 65px) 180px, transparent 100%, black 100%)
          `
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
          padding: '24px',
          paddingBottom: '100px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.2)',
          animation: 'slideUp 0.3s ease-out',
          fontFamily: 'var(--FONT_FAMILY)',
          overflowY: 'auto'
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '2px',
            margin: '0 auto 24px auto'
          }}
        />
        
        {/* Picker container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            margin: '0 0 40px 0'
          }}
        >
          {/* Numerator picker */}
          <div style={{ flex: 1, maxWidth: '80px' }}>
            <RollingPicker
              values={numerators}
              selectedIndex={getNumeratorIndex()}
              onChange={handleNumeratorChange}
              height={240}
              itemHeight={48}
              fontSize="22.5px"
              fontWeight="900"
              fontFamily="var(--FONT_FAMILY)"
              textColor="var(--text-primary)"
              selectedColor="var(--text-primary)"
            />
          </div>

          {/* Divider */}
          <div
            style={{
              fontSize: '28px',
              fontWeight: '900',
              color: 'var(--text-primary)',
              fontFamily: 'var(--FONT_FAMILY)',
              margin: '0 8px'
            }}
          >
            /
          </div>

          {/* Denominator picker */}
          <div style={{ flex: 1, maxWidth: '80px' }}>
            <RollingPicker
              values={denominators}
              selectedIndex={getDenominatorIndex()}
              onChange={handleDenominatorChange}
              height={240}
              itemHeight={48}
              fontSize="22.5px"
              fontWeight="900"
              fontFamily="var(--FONT_FAMILY)"
              textColor="var(--text-primary)"
              selectedColor="var(--text-primary)"
            />
          </div>
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
            padding: '0',
            marginTop: '20px'
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

export default TimeSignatureModal;