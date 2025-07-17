import React, { useState, useEffect } from "react";
// ✅ [수정] Lucide React 아이콘으로 변경
import { Music, X, ThumbsUp, Star, Sparkles } from "lucide-react";

interface HomeStopModalProps {
  isOpen: boolean;
  practiceTime: string;
  onComplete: () => void;
  onEditTime: () => void;
  onClose: () => void;
}

export function HomeStopModal({ 
  isOpen, 
  practiceTime, 
  onComplete, 
  onEditTime, 
  onClose 
}: HomeStopModalProps) {
  const [practiceNote, setPracticeNote] = useState("");
  // ✨ 마이크로 인터랙션 상태 추가
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timerState = localStorage.getItem('timerState');
      if (timerState) {
        try {
          const { memo } = JSON.parse(timerState);
          setPracticeNote(memo || "");
        } catch (error) {
          console.error('메모 불러오기 실패:', error);
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const timerState = localStorage.getItem('timerState');
    if (timerState) {
      try {
        const parsed = JSON.parse(timerState);
        parsed.memo = practiceNote;
        localStorage.setItem('timerState', JSON.stringify(parsed));
      } catch (error) {
        console.error('메모 저장 실패:', error);
      }
    }
  }, [practiceNote]);

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  // ✨ 마이크로 인터랙션이 적용된 완료 함수
  const handleComplete = () => {
    setIsCompleting(true);
    setShowCelebration(true);
    
    // 1초 후 실제 완료 처리
    setTimeout(() => {
      onComplete();
      setIsCompleting(false);
      setShowCelebration(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(45, 45, 42, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "40px 20px",
        WebkitBackfaceVisibility: "hidden",
        transform: "translateZ(0)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: 8,
          width: "100%",
          maxWidth: 345,
          height: "auto",
          minHeight: 320,
          maxHeight: "80vh",
          boxShadow: "var(--shadow-medium)",
          display: "flex",
          flexDirection: "column",
          padding: "32px 20px 20px 20px",
          boxSizing: "border-box",
          position: "relative",
          overflowY: "auto",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          ...commonFontStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 우측 상단 X 버튼 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          disabled={isCompleting}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 20,
            height: 20,
            background: "none",
            border: "none",
            cursor: isCompleting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            opacity: isCompleting ? 0.5 : 1
          }}
        >
          <X style={{ color: "var(--text-secondary)" }} width={20} height={20} />
        </button>

        {/* 제목 + 아이콘 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 24,
          marginTop: 4,
          ...commonFontStyle
        }}>
          <Music 
            style={{ color: "var(--TURQUOISE)" }}
            width={24} 
            height={24}
          />
          <span style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)"
          }}>
            오늘 {practiceTime} 연습
          </span>
        </div>

        {/* 연습 노트 입력 */}
        <div style={{
          marginBottom: 20
        }}>
          <textarea
            value={practiceNote}
            onChange={(e) => setPracticeNote(e.target.value)}
            placeholder="오늘의 연습 노트를 작성해보세요..."
            disabled={isCompleting}
            style={{
              width: "100%",
              height: 150,
              border: "var(--border-light)",
              borderRadius: "var(--border-radius-medium)",
              padding: 16,
              fontSize: 16,
              color: "var(--text-primary)",
              background: "var(--bg-primary)",
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
              opacity: isCompleting ? 0.5 : 1,
              cursor: isCompleting ? "not-allowed" : "text",
              ...commonFontStyle
            }}
          />
        </div>

        {/* 버튼들 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12
        }}>
          {/* ✨ 마이크로 인터랙션이 적용된 피퇴 버튼 */}
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            style={{
              width: 140,
              height: 35,
              borderRadius: "var(--border-radius-small)",
              border: "none",
              background: showCelebration ? "var(--VIVA_MAGENTA)" : "var(--TURQUOISE)",
              color: "var(--button-primary-text)",
              fontSize: 16,
              fontWeight: 600,
              cursor: isCompleting ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              transform: showCelebration ? "scale(1.1)" : "scale(1)",
              position: "relative",
              overflow: "visible",
              animation: showCelebration ? "buttonBounce 0.6s ease-out" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              ...commonFontStyle
            }}
          >
            {isCompleting ? (
              <>
                <ThumbsUp width={16} height={16} />
                수고하셨습니다!
              </>
            ) : (
              "피퇴"
            )}
            
            {/* ✨ 색종이 + 반짝이 파티클 효과 */}
            {showCelebration && (
              <>
                {/* 별과 반짝이 */}
                <Star style={{
                  position: "absolute",
                  top: "-8px",
                  left: "15%",
                  width: "12px",
                  height: "12px",
                  color: "#F0C05A", // MIMOSA
                  animation: "sparkleJump 1s ease-out forwards",
                  animationDelay: "0s"
                }} />
                <Sparkles style={{
                  position: "absolute",
                  top: "-12px",
                  right: "20%",
                  width: "10px",
                  height: "10px",
                  color: "#BB2649", // VIVA_MAGENTA
                  animation: "sparkleJump 1s ease-out forwards",
                  animationDelay: "0.1s"
                }} />
                <Star style={{
                  position: "absolute",
                  bottom: "-8px",
                  left: "25%",
                  width: "12px",
                  height: "12px",
                  color: "#F0C05A", // MIMOSA
                  animation: "sparkleJump 1s ease-out forwards",
                  animationDelay: "0.2s"
                }} />
                <Sparkles style={{
                  position: "absolute",
                  bottom: "-12px",
                  right: "15%",
                  width: "10px",
                  height: "10px",
                  color: "#BB2649", // VIVA_MAGENTA
                  animation: "sparkleJump 1s ease-out forwards",
                  animationDelay: "0.3s"
                }} />

                {/* 색종이 효과 */}
                <span style={{
                  position: "absolute",
                  top: "-10px",
                  left: "5%",
                  width: "4px",
                  height: "4px",
                  background: "#F0C05A", // MIMOSA
                  animation: "confettiDrop 1.2s ease-out forwards",
                  animationDelay: "0s"
                }}></span>
                <span style={{
                  position: "absolute",
                  top: "-15px",
                  left: "30%",
                  width: "3px",
                  height: "6px",
                  background: "#45b5aa", // TURQUOISE
                  animation: "confettiDrop 1.2s ease-out forwards",
                  animationDelay: "0.1s"
                }}></span>
                <span style={{
                  position: "absolute",
                  top: "-12px",
                  right: "5%",
                  width: "4px",
                  height: "4px",
                  background: "#BB2649", // VIVA_MAGENTA
                  animation: "confettiDrop 1.2s ease-out forwards",
                  animationDelay: "0.2s"
                }}></span>
                <span style={{
                  position: "absolute",
                  top: "-8px",
                  right: "35%",
                  width: "3px",
                  height: "5px",
                  background: "#B0876F", // 세 번째 테마 컬러
                  animation: "confettiDrop 1.2s ease-out forwards",
                  animationDelay: "0.15s"
                }}></span>
                <span style={{
                  position: "absolute",
                  top: "-14px",
                  left: "50%",
                  width: "4px",
                  height: "3px",
                  background: "#6b778d", // VERY_PERI
                  animation: "confettiDrop 1.2s ease-out forwards",
                  animationDelay: "0.05s"
                }}></span>
                <span style={{
                  position: "absolute",
                  top: "-11px",
                  right: "45%",
                  width: "3px",
                  height: "4px",
                  background: "#F0C05A", // MIMOSA
                  animation: "confettiDrop 1.2s ease-out forwards",
                  animationDelay: "0.25s"
                }}></span>
              </>
            )}
          </button>
          
          <button
            onClick={onEditTime}
            disabled={isCompleting}
            style={{
              width: 140,
              height: 35,
              borderRadius: "var(--border-radius-small)",
              border: "none",
              background: "var(--text-secondary)",
              color: "var(--text-primary)",
              fontSize: 16,
              fontWeight: 600,
              cursor: isCompleting ? "not-allowed" : "pointer",
              transition: "var(--transition-fast)",
              opacity: isCompleting ? 0.5 : 1,
              ...commonFontStyle
            }}
          >
            시간 수정
          </button>
        </div>

        {/* ✨ CSS 애니메이션 */}
        <style>
          {`
            @keyframes buttonBounce {
              0%, 20%, 50%, 80%, 100% {
                transform: translateY(0) scale(1);
              }
              40% {
                transform: translateY(-8px) scale(1.05);
              }
              60% {
                transform: translateY(-4px) scale(1.08);
              }
            }

            @keyframes sparkleJump {
              0% {
                opacity: 0;
                transform: translateY(0px) scale(0.3) rotate(0deg);
              }
              50% {
                opacity: 1;
                transform: translateY(-15px) scale(1.2) rotate(180deg);
              }
              100% {
                opacity: 0;
                transform: translateY(-25px) scale(0.5) rotate(360deg);
              }
            }

            @keyframes confettiDrop {
              0% {
                opacity: 1;
                transform: translateY(0px) translateX(0px) rotate(0deg);
              }
              50% {
                opacity: 1;
                transform: translateY(-20px) translateX(-10px) rotate(180deg);
              }
              100% {
                opacity: 0;
                transform: translateY(30px) translateX(15px) rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}