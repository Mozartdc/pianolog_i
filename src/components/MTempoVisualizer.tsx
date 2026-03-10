import React from 'react';

// TypeScript interface definitions
type BeatStrength = 0 | 1 | 2 | 'A';

interface MTempoVisualizerProps {
  beatCount?: number;                           // Number of beats (1-16)
  currentBeat?: number;                         // Currently active beat (starts from 0)
  beatPattern?: BeatStrength[];                 // Accent pattern [0, 1, 2, 'A']
  onBeatClick?: (beatIndex: number) => void;    // Beat click handler (optional)
}

const MTempoVisualizer: React.FC<MTempoVisualizerProps> = ({ 
  beatCount = 4,
  currentBeat = 0,
  beatPattern = [],
  onBeatClick
}) => {
  // Return beat strength (with type safety)
  const getBeatType = (beatIndex: number): BeatStrength => {
    if (beatIndex >= beatPattern.length) return 1; // Default: weak beat
    return beatPattern[beatIndex];
  };

  // Set responsive layout
  const getLayoutConfig = (): {
    gap: string;
    maxPerRow: number;
    pointSize: number;
    centerSize: number;
    rippleSize: number;
    containerPadding: string;
  } => {
    if (beatCount <= 4) return { gap: '20px', maxPerRow: 4, pointSize: 24, centerSize: 10, rippleSize: 34, containerPadding: '20px' };
    if (beatCount <= 8) return { gap: '14px', maxPerRow: 8, pointSize: 22, centerSize: 9, rippleSize: 30, containerPadding: '16px' };
    if (beatCount <= 12) return { gap: '8px', maxPerRow: 12, pointSize: 18, centerSize: 7, rippleSize: 24, containerPadding: '12px' };
    return { gap: '0px', maxPerRow: 16, pointSize: 13, centerSize: 5, rippleSize: 16, containerPadding: '6px' };
  };

  const layoutConfig = getLayoutConfig();

  return (
    <div className="tempo-visualizer">
      <style>
        {`
          .tempo-visualizer {
            --silent-bg: transparent;
            --silent-border: #666;
            --silent-border-width: 0.7px;
            
            --weak-bg: #888;
            --weak-border: #666;
            --weak-border-width: 1px;
            
            --strong-bg: #4ecdc4;
            --strong-border: #3baba3;
            --strong-border-width: 1px;
            
            --accent-bg: #4ecdc4;
            --accent-border: #3baba3;
            --accent-border-width: 1px;
            --accent-symbol-color: #f39c12;
            
            --ripple-duration: 0.8s;
            --ripple-size: ${layoutConfig.rippleSize}px;
            width: 100%;
          }

          .beat-container {
            display: grid;
            grid-template-columns: repeat(${Math.min(beatCount, layoutConfig.maxPerRow)}, 1fr);
            gap: ${layoutConfig.gap};
            justify-content: center;
            justify-items: center;
            align-items: center;
            min-height: 80px;
            padding: ${layoutConfig.containerPadding};
            width: 100%;
            box-sizing: border-box;
          }

          .beat-point {
            position: relative;
            width: ${layoutConfig.pointSize}px;
            height: ${layoutConfig.pointSize}px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: ${onBeatClick ? 'pointer' : 'default'};
            touch-action: manipulation;
          }

          .beat-center {
            width: ${layoutConfig.centerSize}px;
            height: ${layoutConfig.centerSize}px;
            border-radius: 50%;
            position: absolute;
            transition: all 0.3s ease;
          }

          .beat-wave {
            position: absolute;
            border-radius: 50%;
            opacity: 0;
            pointer-events: none;
          }

          /* Silent (0) */
          .beat-point.silent .beat-center {
            background: var(--silent-bg);
            border: var(--silent-border-width) solid var(--silent-border);
          }

          .beat-point.silent .beat-wave {
            border: 1.6px solid rgba(120, 120, 120, 0.9);
          }

          /* Weak beat (1) */
          .beat-point.weak .beat-center {
            background: var(--weak-bg);
            border: var(--weak-border-width) solid var(--weak-border);
          }

          .beat-point.weak .beat-wave {
            border: 1.8px solid rgba(120, 120, 120, 0.95);
          }

          /* Strong beat (2) */
          .beat-point.strong .beat-center {
            background: var(--strong-bg);
            border: var(--strong-border-width) solid var(--strong-border);
          }

          .beat-point.strong .beat-wave {
            border: 2.4px solid rgba(78, 205, 196, 1);
          }

          /* Accent (A) */
          .beat-point.accent .beat-center {
            background: var(--accent-bg);
            border: var(--accent-border-width) solid var(--accent-border);
          }

          .beat-point.accent .beat-wave {
            border: 2.4px solid rgba(243, 156, 18, 1);
          }

          /* Accent symbol ^ */
          .accent-indicator {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
            opacity: 0.7;
          }

          .accent-symbol {
            width: 8px;
            height: 6px;
            position: relative;
          }

          .accent-symbol::before,
          .accent-symbol::after {
            content: '';
            position: absolute;
            width: 2px;
            height: 5px;
            background: var(--accent-symbol-color);
            bottom: 0;
            border-radius: 1px;
          }

          .accent-symbol::before {
            left: 1px;
            transform: rotate(30deg);
            transform-origin: bottom;
          }

          .accent-symbol::after {
            right: 1px;
            transform: rotate(-30deg);
            transform-origin: bottom;
          }

          /* Active state */
          .beat-point.active .beat-center {
            transform: scale(1.2);
          }

          .beat-point.accent.active .accent-indicator {
            opacity: 1;
            transform: translateX(-50%) translateY(-2px);
          }

          .beat-point.active .beat-wave {
            animation: rippleEffect var(--ripple-duration) ease-out;
            opacity: 1;
          }

          @keyframes rippleEffect {
            0% {
              width: 6px;
              height: 6px;
              opacity: 1;
            }
            55% {
              opacity: 0.45;
            }
            100% {
              width: var(--ripple-size);
              height: var(--ripple-size);
              opacity: 0;
            }
          }

        `}
      </style>

      <div className="beat-container">
        {Array.from({ length: beatCount }, (_, index) => {
          const beatType: BeatStrength = getBeatType(index);
          const isActive: boolean = currentBeat === index;
          
          // Determine CSS class
          const getClassName = (): string => {
            let className = 'beat-point';
            if (beatType === 0) className += ' silent';
            else if (beatType === 1) className += ' weak';
            else if (beatType === 2) className += ' strong';
            else if (beatType === 'A') className += ' accent';
            
            if (isActive) className += ' active';
            return className;
          };

          return (
            <div 
              key={index} 
              className={getClassName()}
              onClick={() => onBeatClick?.(index)}
            >
              <div className="beat-center" />
              <div className="beat-wave" />
              {beatType === 'A' && (
                <div className="accent-indicator">
                  <div className="accent-symbol" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MTempoVisualizer;
