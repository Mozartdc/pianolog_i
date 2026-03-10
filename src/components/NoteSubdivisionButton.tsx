// src/components/NoteSubdivisionButton.tsx

import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { renderRhythm, getPatternDimensions } from '../utils/rhythmUtils';

interface NoteSubdivisionButtonProps {
  onClick?: () => void;
  isDisabled?: boolean;
  currentRhythmId?: string;
  denominator?: number;
}

const NoteSubdivisionButton = forwardRef<HTMLButtonElement, NoteSubdivisionButtonProps>(
  ({ onClick, isDisabled = false, currentRhythmId = 'one_beat', denominator = 4 }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [buttonSize, setButtonSize] = useState({ width: 50, height: 50 });

    // Re-render notes and adjust button size whenever currentRhythmId changes
    useEffect(() => {
      if (containerRef.current) {
        renderRhythm(containerRef.current, currentRhythmId, denominator);
        
        // Dynamically adjust button size based on pattern's actual size
        const dimensions = getPatternDimensions(currentRhythmId);
        const buttonWidth = Math.max(50, dimensions.width + 20); // Minimum 50px, padding 20px
        const buttonHeight = Math.max(50, dimensions.height + 10); // Minimum 50px, padding 10px
        
        setButtonSize({ width: buttonWidth, height: buttonHeight });
      }
    }, [currentRhythmId, denominator]);

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={isDisabled}
        style={{
          width: `${buttonSize.width}px`,
          height: `${buttonSize.height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          color: 'var(--text-primary)',
          transition: 'width 0.2s ease, height 0.2s ease' // Smooth size transition
        }}
      >
        <div 
          ref={containerRef} 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} 
        />
      </button>
    );
  }
);

export default NoteSubdivisionButton;
