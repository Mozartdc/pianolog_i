import React, { useEffect, useRef } from "react";
import confetti, { CreateTypes } from "canvas-confetti";

interface Props {
  isActive: boolean;
  onComplete?: () => void;
}

const ConfettiAnimation: React.FC<Props> = ({ isActive, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasRunRef = useRef(false); // Flag to make sure it only runs once

  // Only depend on isActive, manage onComplete with useRef
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isActive || !canvasRef.current || hasRunRef.current) return;

    hasRunRef.current = true; // Set the run flag

    // Create confetti instance
    const myConfetti = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    // Animation sequence function
    const runAnimationSequence = () => {
      const duration = 4 * 1000; // Total animation time (4 seconds)
      const animationEnd = Date.now() + duration;

      const colors = ["#45b5aa", "#6b778d", "#D2649A", "#f0c05a", "#FFC107"];

      // 1. Opening: gentle start from both sides
      setTimeout(() => {
        myConfetti({
          particleCount: 100,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.8 },
          colors: colors,
          drift: -0.2,
        });
        myConfetti({
          particleCount: 100,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.8 },
          colors: colors,
          drift: 0.2,
        });
      }, 0);

      // 2. Main burst: big explosion from center
      setTimeout(() => {
        myConfetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.7 },
          startVelocity: 35,
          gravity: 0.8,
          ticks: 300,
          zIndex: 1000,
          colors: colors,
        });
      }, 300);

      // 3. Finale: sparkly effect across the whole screen
      const finaleInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(finaleInterval);
          return;
        }
        
        const particleCount = 50 * (timeLeft / duration);
        myConfetti({
          particleCount,
          startVelocity: 0,
          spread: 360,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: colors,
          shapes: ['star'],
          gravity: 0.5,
          drift: Math.random() > 0.5 ? 1 : -1,
          scalar: Math.random() * 0.5 + 0.5,
        });
      }, 200);

      // Clean up after all animations are done
      const cleanupTimer = setTimeout(() => {
        myConfetti.reset();
        hasRunRef.current = false; // Reset so it can run again next time
        onCompleteRef.current?.(); // Call onComplete through ref
      }, duration + 1000);

      // Store timer IDs
      animationRef.current.push(finaleInterval, cleanupTimer);
    };

    runAnimationSequence();

    // Clean up all timers when component unmounts
    return () => {
      animationRef.current.forEach((timer) => clearTimeout(timer));
      animationRef.current = [];
      hasRunRef.current = false; // Reset flag during cleanup too
    };
  }, [isActive]); // Removed onComplete from dependencies

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
};

export default ConfettiAnimation;