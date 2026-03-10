import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PlusIcon from '../assets/icons/plus.svg?react';
import MinusIcon from '../assets/icons/minus.svg?react';;
import PlayIcon from '../assets/icons/play.svg?react';
import PauseIcon from '../assets/icons/pause.svg?react';

interface MCentralControlsProps {
  currentBPM?: number;
  isPlaying?: boolean;
  tempoMarking?: string;
  className?: string;
  theme?: {
    activeColor?: string;
    inactiveColor?: string;
    textColor?: string;
    playButtonColor?: string;
  };
  onBPMChange?: (bpm: number) => void;
  onPlayToggle?: () => void;
  minBPM?: number;
  maxBPM?: number;
  enableDrag?: boolean;
  enableKeyboard?: boolean;
}

export function MCentralControls({
  currentBPM = 120,
  isPlaying = false,
  tempoMarking,
  className = '',
  theme = {},
  onBPMChange,
  onPlayToggle,
  minBPM = 20,
  maxBPM = 400,
  enableDrag = true,
  enableKeyboard = true,
}: MCentralControlsProps) {
  const [plusActive, setPlusActive] = useState(false);
  const [minusActive, setMinusActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef<boolean>(false);
  const startAngleRef = useRef<number>(0);
  const currentAngleRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const jogShuttleRef = useRef<HTMLDivElement>(null);
  const dialProgressRef = useRef<SVGCircleElement>(null);
  const baseBPMRef = useRef<number>(currentBPM);
  const angleDeltaRef = useRef<number>(0);

  const dragRAF = useRef<number | null>(null);
  const queuedCoords = useRef<{ x: number; y: number } | null>(null);

  // Refs for dynamic sensitivity
  const velEMARef = useRef(0); // deg/s exponential smoothing
  const lastTsRef = useRef<number>(0); // ms

  const size = 180;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const cssVariables = useMemo(() => ({
    '--dial-active-color': theme.activeColor || 'var(--LIVING_CORAL)',
    '--dial-inactive-color': theme.inactiveColor || 'var(--DARK_GRAY)',
    '--dial-text-color': theme.textColor || 'var(--BLACK)',
    '--dial-play-button-color': theme.playButtonColor || 'var(--TURQUOISE)',
  } as React.CSSProperties), [theme]);

  const getTempoMarking = useCallback((bpm: number): string => {
    if (bpm <= 24) return "Larghissimo";
    if (bpm <= 40) return "Grave";
    if (bpm <= 60) return "Largo";
    if (bpm <= 66) return "Larghetto";
    if (bpm <= 72) return "Adagio";
    if (bpm <= 76) return "Adagietto";
    if (bpm <= 80) return "Andante";
    if (bpm <= 92) return "Andantino";
    if (bpm <= 108) return "Andante moderato";
    if (bpm <= 112) return "Moderato";
    if (bpm <= 120) return "Allegretto";
    if (bpm <= 168) return "Allegro";
    if (bpm <= 172) return "Vivace";
    if (bpm <= 176) return "Vivacissimo";
    if (bpm <= 200) return "Presto";
    return "Prestissimo";
  }, []);

  const displayTempoMarking = tempoMarking || getTempoMarking(currentBPM);

  const updateVariableDraw = useCallback(() => {
    if (!dialProgressRef.current) return;
    const signed = angleDeltaRef.current;
    const capped = Math.max(-360, Math.min(360, signed));
    const drawLength = Math.abs(capped) / 360 * circumference;
    const startAngleForDraw = startAngleRef.current + Math.min(0, capped);
    const startOffset = (((startAngleForDraw % 360) + 360) % 360) / 360 * circumference;
    const gapLength = circumference - drawLength;
    const c = dialProgressRef.current;
    c.style.strokeDasharray = `${drawLength} ${gapLength}`;
    c.style.strokeDashoffset = `${circumference - startOffset}`;
    c.style.opacity = drawLength > 0.1 ? '1' : '0';
  }, [circumference]);

  const animateDecay = useCallback(() => {
    if (isDraggingRef.current || !dialProgressRef.current) return;
    angleDeltaRef.current *= 0.92;
    if (Math.abs(angleDeltaRef.current) < 0.5) {
      angleDeltaRef.current = 0;
      const c = dialProgressRef.current;
      c.style.strokeDasharray = `0 ${circumference}`;
      c.style.strokeDashoffset = `${circumference}`;
      c.style.opacity = '0';
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    updateVariableDraw();
    animationFrameRef.current = requestAnimationFrame(animateDecay);
  }, [circumference, updateVariableDraw]);

  const getAngleDifference = useCallback((a1: number, a2: number): number => {
    let diff = a2 - a1;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }, []);

  const updateBPM = useCallback((bpm: number) => {
    const newBPM = Math.max(minBPM, Math.min(maxBPM, Math.round(bpm)));
    if (newBPM !== currentBPM) onBPMChange?.(newBPM);
  }, [minBPM, maxBPM, currentBPM, onBPMChange]);

  const handleIncrement = useCallback(() => {
    onBPMChange?.(Math.min(maxBPM, currentBPM + 1));
    setPlusActive(true); setTimeout(() => setPlusActive(false), 150);
  }, [currentBPM, maxBPM, onBPMChange]);

  const handleDecrement = useCallback(() => {
    onBPMChange?.(Math.max(minBPM, currentBPM - 1));
    setMinusActive(true); setTimeout(() => setMinusActive(false), 150);
  }, [currentBPM, minBPM, onBPMChange]);

  const handlePlayToggle = useCallback(() => onPlayToggle?.(), [onPlayToggle]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enableKeyboard) return;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight': e.preventDefault(); handleIncrement(); break;
      case 'ArrowDown':
      case 'ArrowLeft': e.preventDefault(); handleDecrement(); break;
      case ' ':
      case 'Enter': e.preventDefault(); handlePlayToggle(); break;
    }
  }, [enableKeyboard, handleIncrement, handleDecrement, handlePlayToggle]);

  // Dynamic sensitivity logic applied
  const processDrag = useCallback((clientX: number, clientY: number) => {
    if (!enableDrag || !isDraggingRef.current) return;
    const rect = jogShuttleRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let newAngle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI + 90;
    if (newAngle < 0) newAngle += 360;
    if (newAngle >= 360) newAngle -= 360;

    const angleDiff = getAngleDifference(currentAngleRef.current, newAngle);
    if (Math.abs(angleDiff) > 0.1) {
      // --- Dynamic sensitivity calculation start ---
      const now = performance.now();
      const dt = Math.max((now - lastTsRef.current) / 1000, 1/1000); // in seconds
      lastTsRef.current = now;

      const instVel = Math.abs(angleDiff) / dt; // instant velocity (deg/s)
      velEMARef.current = velEMARef.current * 0.8 + instVel * 0.2; // EMA filtering

      // Velocity -> sensitivity mapping (10 ~ 20 BPM/turn)
      const V_LOW = 90;    // slow velocity threshold (deg/s)
      const V_HIGH = 360;  // fast velocity threshold (deg/s)
      let t = Math.min(1, Math.max(0, (velEMARef.current - V_LOW) / (V_HIGH - V_LOW)));
      t = t * t; // Ease-in acceleration curve

      const bpmPerTurn = 10 + (20 - 10) * t; // 10~20 BPM/turn
      const sensitivity = bpmPerTurn / 360; // BPM/deg

      // Keep angleDeltaRef in 'degrees' for visual consistency
      const candidateDeg = angleDeltaRef.current + angleDiff;

      // Calculate max/min angles based on BPM limits for current sensitivity
      const maxUpDeg = (maxBPM - baseBPMRef.current) / sensitivity;
      const maxDownDeg = (minBPM - baseBPMRef.current) / sensitivity;
      const clampedDeg = Math.max(maxDownDeg, Math.min(maxUpDeg, candidateDeg));
      
      angleDeltaRef.current = clampedDeg;
      updateBPM(baseBPMRef.current + angleDeltaRef.current * sensitivity);
      // --- Dynamic sensitivity calculation end ---

      if (angleDiff > 0) { setPlusActive(true); setMinusActive(false); } else { setMinusActive(true); setPlusActive(false); }
    }
    updateVariableDraw();
    currentAngleRef.current = newAngle;
  }, [enableDrag, getAngleDifference, updateBPM, updateVariableDraw, minBPM, maxBPM]);

  const pumpDrag = useCallback(() => {
    dragRAF.current = null;
    if (!queuedCoords.current) return;
    const { x, y } = queuedCoords.current;
    queuedCoords.current = null;
    processDrag(x, y);
  }, [processDrag]);

  const throttledDragMove = useCallback((clientX: number, clientY: number) => {
    queuedCoords.current = { x: clientX, y: clientY };
    if (!dragRAF.current) {
      dragRAF.current = requestAnimationFrame(pumpDrag);
    }
  }, [pumpDrag]);
  
  const startDrag = (clientX: number, clientY: number) => {
    if (!enableDrag) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    if (dragRAF.current) { cancelAnimationFrame(dragRAF.current); dragRAF.current = null; }
    queuedCoords.current = null;
  
    const rect = jogShuttleRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let initialAngle = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI + 90;
    if (initialAngle < 0) initialAngle += 360;
    startAngleRef.current = initialAngle;
    currentAngleRef.current = initialAngle;
  
    baseBPMRef.current = currentBPM;
    angleDeltaRef.current = 0;

    // Initialize dynamic sensitivity refs
    lastTsRef.current = performance.now();
    velEMARef.current = 0;
  
    if (dialProgressRef.current) {
      const c = dialProgressRef.current;
      c.style.strokeDasharray = `0 ${circumference}`;
      c.style.strokeDashoffset = `${circumference}`;
      c.style.opacity = '0';
    }
  };
  
  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    setIsDragging(false);
    isDraggingRef.current = false;
    setPlusActive(false); setMinusActive(false);
    if (dragRAF.current) { cancelAnimationFrame(dragRAF.current); dragRAF.current = null; }
    queuedCoords.current = null;
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateDecay);
    }
  }, [animateDecay]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
    const handleMouseMove = (moveEvent: MouseEvent) => throttledDragMove(moveEvent.clientX, moveEvent.clientY);
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      endDrag();
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [throttledDragMove, endDrag, startDrag]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
    const handleTouchMove = (moveEvent: TouchEvent) => { if (moveEvent.touches.length > 0) throttledDragMove(moveEvent.touches[0].clientX, moveEvent.touches[0].clientY); };
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      endDrag();
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [throttledDragMove, endDrag, startDrag]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (dragRAF.current) cancelAnimationFrame(dragRAF.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: size, height: size, fontFamily: 'var(--FONT_FAMILY)', ...cssVariables }} className={className}>
      <div
        ref={jogShuttleRef}
        style={{ width: '100%', height: '100%', cursor: enableDrag ? (isDragging ? 'grabbing' : 'grab') : 'default', userSelect: 'none', touchAction: enableDrag ? 'none' : 'auto' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
        role="slider"
        aria-valuemin={minBPM}
        aria-valuemax={maxBPM}
        aria-valuenow={currentBPM}
        aria-valuetext={`${currentBPM} BPM, ${displayTempoMarking}`}
        aria-label="BPM control dial"
        tabIndex={enableKeyboard ? 0 : -1}
      >
        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--dial-inactive-color)" strokeWidth={strokeWidth} strokeLinecap="butt" opacity="0.3" />
          <circle ref={dialProgressRef} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--dial-active-color)" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`0 ${circumference}`} strokeDashoffset={circumference} opacity={0} style={{ transition: 'opacity 0.2s ease-out' }} />
        </svg>
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, calc(-50% - 42px))', fontSize: '15px', fontWeight: 300, color: 'var(--dial-text-color)', pointerEvents: 'none', textAlign: 'center', lineHeight: '0.95', maxWidth: '120px', whiteSpace: 'normal', wordBreak: 'keep-all' }}>{displayTempoMarking}</div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '48px', fontWeight: 900, color: 'var(--dial-text-color)', pointerEvents: 'none', lineHeight: '1', textAlign: 'center' }}>{currentBPM}</div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, calc(-50% + 39px))', fontSize: '15px', fontWeight: 900, color: 'var(--dial-inactive-color)', pointerEvents: 'none', textAlign: 'center' }}>bpm</div>
      
      <button onClick={handlePlayToggle} style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '35px', height: '35px', background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'var(--dial-play-button-color)' }} aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <PauseIcon width={35} height={35} /> : <PlayIcon width={35} height={35} />}
      </button>

      <button onClick={handleIncrement} style={{ position: 'absolute', top: '0px', right: '-30px', width: '30px', height: '30px', background: 'none', border: 'none', cursor: currentBPM >= maxBPM ? 'not-allowed' : 'pointer', padding: '0', color: plusActive ? 'var(--dial-active-color)' : 'var(--dial-text-color)', opacity: currentBPM >= maxBPM ? 0.5 : 1, transition: 'color 0.1s ease' }} aria-label="Increase BPM" 
        disabled={isDragging || currentBPM >= maxBPM}>
        <PlusIcon width={30} height={30} />
      </button>

      <button onClick={handleDecrement} style={{ position: 'absolute', top: '0px', left: '-30px', width: '30px', height: '30px', background: 'none', border: 'none', cursor: currentBPM <= minBPM ? 'not-allowed' : 'pointer', padding: '0', color: minusActive ? 'var(--dial-active-color)' : 'var(--dial-text-color)', opacity: currentBPM <= minBPM ? 0.5 : 1, transition: 'color 0.1s ease' }} aria-label="Decrease BPM" 
        disabled={isDragging || currentBPM <= minBPM}>
        <MinusIcon width={30} height={30} />
      </button>
    </div>
  );
}
