// src/components/RollingPicker.tsx - Updated version
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface RollingPickerProps<T = any> {
  values: T[];
  selectedIndex: number;
  onChange: (index: number) => void;
  height?: number;
  itemHeight?: number;
  renderItem?: (value: T, index: number) => React.ReactNode;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  textColor?: string;
  selectedColor?: string;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const RollingPicker = <T = any,>({
  values,
  selectedIndex,
  onChange,
  height = 180,
  itemHeight = 36,
  renderItem,
  fontSize = '16px',
  fontWeight = '500',
  fontFamily = 'var(--FONT_FAMILY)',
  textColor = 'var(--text-primary)',
  selectedColor = 'var(--text-primary)',
}: RollingPickerProps<T>) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pos, setPos] = useState<number>(selectedIndex);
  const [startY, setStartY] = useState(0);
  const [startPos, setStartPos] = useState(0);
  const [vel, setVel] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [lastT, setLastT] = useState(0);

  const animRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const angleDeg = 20;
  const angleRad = (Math.PI / 180) * angleDeg;
  const radius = itemHeight / (2 * Math.tan(angleRad / 2));

  useEffect(() => {
    if (!isDragging && !isAnimating) setPos(clamp(selectedIndex, 0, values.length - 1));
  }, [selectedIndex, isDragging, isAnimating, values.length]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  const handleStart = useCallback((clientY: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsAnimating(false);
    setIsDragging(true);
    setStartY(clientY);
    setStartPos(pos);
    setLastY(clientY);
    setLastT(performance.now());
    setVel(0);
  }, [pos]);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;

    const now = performance.now();
    const dy = clientY - lastY;
    const dt = now - lastT;
    if (dt > 0) {
      const inst = -(dy / itemHeight) / dt;
      setVel(v => v * 0.8 + inst * 0.2);
    }

    const totalDy = clientY - startY;
    const nextPos = clamp(startPos - totalDy / itemHeight, 0, values.length - 1);
    setPos(nextPos);
    setLastY(clientY);
    setLastT(now);
  }, [isDragging, startY, startPos, lastY, lastT, itemHeight, values.length]);

  const snapTo = useCallback((targetIndex: number, duration = 180) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsAnimating(true);

    const start = performance.now();
    const from = pos;
    const to = clamp(targetIndex, 0, values.length - 1);

    const tick = (t: number) => {
      const e = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - e, 4);
      setPos(from + (to - from) * eased);
      if (e < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        const idx = Math.round(to);
        if (idx !== selectedIndex) onChange(idx);
        setIsAnimating(false);
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [pos, values.length, selectedIndex, onChange]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const projectionMs = 220;
    const projected = pos + vel * projectionMs;
    const target = Math.round(clamp(projected, 0, values.length - 1));
    snapTo(target, 180);
  }, [isDragging, pos, vel, values.length, snapTo]);

  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientY); };
  const handleMouseMove = useCallback((e: MouseEvent) => { handleMove(e.clientY); }, [handleMove]);
  const handleMouseUp = useCallback(() => { handleEnd(); }, [handleEnd]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    handleStart(e.touches[0].clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (e.touches.length) handleMove(e.touches[0].clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback((_e: TouchEvent) => {
    handleEnd();
  }, [handleEnd]);
  
  useEffect(() => {
    if (!isDragging) return;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    el.addEventListener('touchstart', handleTouchStart as any, { passive: false } as any);
    el.addEventListener('touchmove', handleTouchMove as any, { passive: false } as any);
    el.addEventListener('touchend', handleTouchEnd as any, { passive: false } as any);
    el.addEventListener('touchcancel', handleTouchEnd as any, { passive: false } as any);
    
    return () => {
      el.removeEventListener('touchstart', handleTouchStart as any, { passive: false } as any);
      el.removeEventListener('touchmove', handleTouchMove as any, { passive: false } as any);
      el.removeEventListener('touchend', handleTouchEnd as any, { passive: false } as any);
      el.removeEventListener('touchcancel', handleTouchEnd as any, { passive: false } as any);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const selected = clamp(Math.round(pos), 0, values.length - 1);

  const getItemStyle = (index: number) => {
    const rotation = (pos - index) * angleDeg;
    const isSelected = index === selected;
    const distance = Math.abs(pos - index);
    
    // Adjust opacity and scale based on distance to create depth perception
    const opacity = distance > 0.1 ? Math.max(0.72, 1 - (distance * 0.3)) : 1;
    const scale = distance > 0.1 ? Math.max(0.8, 1 - (distance * 0.1)) : 1;
    const zIndex = isSelected ? 100 : Math.max(1, 100 - Math.floor(distance * 10));
    
    return {
      position: 'absolute' as const,
      top: 0, 
      left: 0, 
      right: 0,
      height: itemHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize,
      fontWeight: isSelected ? '600' : fontWeight,
      fontFamily,
      color: isSelected ? selectedColor : textColor,
      opacity,
      backfaceVisibility: 'hidden' as const,
      transform: `rotateX(${rotation}deg) translateZ(${radius}px) scale(${scale})`,
      transition: isDragging ? 'none' : 'all 0.15s ease-out',
      userSelect: 'none' as const,
      pointerEvents: 'none' as const,
      willChange: 'transform',
      lineHeight: '1',
      textAlign: 'center' as const,
      overflow: 'hidden',
      whiteSpace: 'nowrap' as const,
      zIndex: zIndex,
    };
  };

  return (
    <div
      style={{
        height,
        overflow: 'hidden', // Only keep overflow: hidden on the top-level container
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        perspective: '1000px',
        touchAction: 'none',
        width: '100%',
        boxSizing: 'border-box',
      }}
      onWheel={(e) => {
        e.preventDefault();
        const deltaItems = e.deltaY / itemHeight;
        const newPos = clamp(pos + deltaItems, 0, values.length - 1);
        setPos(newPos);
        if (!isDragging) {
          const target = Math.round(newPos);
          snapTo(target, 120);
        }
      }}
    >
      {/* Show selection area */}
      <div
        style={{
          position: 'absolute',
          top: height / 2 - itemHeight / 2,
          left: '5%',
          right: '5%',
          height: itemHeight,
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          pointerEvents: 'none',
          borderRadius: '4px',
        }}
      />
      
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        style={{
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `translateY(${height / 2 - itemHeight / 2}px)`,
          // Removed overflow: 'hidden' to prevent the wheel top from being cut off
          width: '100%',
        }}
      >
        <div style={{ 
          position: 'absolute',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          // Also removed overflow: 'hidden' here
        }}>
          {values.map((v, i) => {
            const distance = Math.abs(pos - i);
            // Don't render items more than 2.5 slots away from center (performance optimization)
            if (distance > 2.5) return null;
            
            return (
              <div key={i} style={getItemStyle(i)}>
                {renderItem ? renderItem(v, i) : String(v)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RollingPicker;
