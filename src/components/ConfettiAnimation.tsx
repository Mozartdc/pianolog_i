import React, { useEffect, useRef } from "react";
import confetti, { CreateTypes } from "canvas-confetti";

interface Props {
  isActive: boolean;
  onComplete?: () => void;
}

const ConfettiAnimation: React.FC<Props> = ({ isActive, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasRunRef = useRef(false); // ✅ 한 번만 실행되도록 하는 플래그

  // ✅ isActive만 의존성으로 하고, onComplete는 useRef로 관리
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isActive || !canvasRef.current || hasRunRef.current) return;

    hasRunRef.current = true; // ✅ 실행 플래그 설정

    // confetti 인스턴스 생성
    const myConfetti = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    // 애니메이션 시퀀스 함수
    const runAnimationSequence = () => {
      const duration = 4 * 1000; // 전체 애니메이션 시간 (4초)
      const animationEnd = Date.now() + duration;

      const colors = ["#45b5aa", "#6b778d", "#D2649A", "#f0c05a", "#FFC107"];

      // 1. 오프닝: 양쪽에서 가볍게 시작
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

      // 2. 메인 버스트: 중앙에서 풍성하게
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

      // 3. 피날레: 화면 전체에 반짝이는 효과
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

      // 모든 애니메이션이 끝난 후 정리
      const cleanupTimer = setTimeout(() => {
        myConfetti.reset();
        hasRunRef.current = false; // ✅ 다음에 다시 실행할 수 있도록 리셋
        onCompleteRef.current?.(); // ✅ ref를 통해 onComplete 호출
      }, duration + 1000);

      // 타이머 ID 저장
      animationRef.current.push(finaleInterval, cleanupTimer);
    };

    runAnimationSequence();

    // 컴포넌트 언마운트 시 모든 타이머 정리
    return () => {
      animationRef.current.forEach((timer) => clearTimeout(timer));
      animationRef.current = [];
      hasRunRef.current = false; // ✅ 정리 시 플래그도 리셋
    };
  }, [isActive]); // ✅ onComplete 제거

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