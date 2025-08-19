import React, { useState, useEffect, useRef } from "react";
import { Music, X } from "lucide-react";
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import EditIcon from "../assets/icons/edit.svg?react";
import PowerIcon from "../assets/icons/power.svg?react";
import likeAnimation from '../assets/like-animation.json';

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
  onClose,
}: HomeStopModalProps) {
  const [practiceNote, setPracticeNote] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (isOpen) {
      // ✅ 새로운 timerV2 키에서 memo 읽기
      const timerState = localStorage.getItem("timerV2");
      if (timerState) {
        try {
          const { memo } = JSON.parse(timerState);
          setPracticeNote(memo || "");
        } catch (error) {
          console.error("메모 불러오기 실패:", error);
        }
      }
      setIsCompleting(false);
      setIsLikeAnimating(false);
    }
  }, [isOpen]);

  // ✅ 새로운 timerV2 키로 memo 저장
  const persistMemo = () => {
    try {
      const s = localStorage.getItem("timerV2");
      if (s) {
        const p = JSON.parse(s);
        p.memo = practiceNote;
        p.lastUpdatedMs = Date.now(); // ✅ 업데이트 시간도 갱신
        localStorage.setItem("timerV2", JSON.stringify(p));
        console.log('📝 HomeStopModal: memo 저장 완료', practiceNote);
      }
    } catch (e) {
      console.error("메모 저장 실패:", e);
    }
  };

  const handleCloseAndSave = () => {
    if (isCompleting || isLikeAnimating) return;
    persistMemo();
    onClose();
  };

  // 피퇴 버튼 클릭 처리
  const handleLikeClick = () => {
    if (isCompleting || isLikeAnimating) return;
    
    setIsLikeAnimating(true);
    setIsCompleting(true);
    
    // Lottie 애니메이션 시작 - 약간의 딜레이 후 확실히 시작
    setTimeout(() => {
      if (lottieRef.current) {
        lottieRef.current.goToAndStop(0, true);
        lottieRef.current.play();
      }
    }, 100);
  };

  // Lottie 애니메이션 완료 처리
  const handleLottieComplete = () => {
    persistMemo();
    onComplete();
  };

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "var(--modal-backdrop-home)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "40px 0px",
      }}
      onClick={handleCloseAndSave}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: 8,
          width: "100%-32px",
          minHeight: 320, maxHeight: "80vh",
          boxShadow: "var(--shadow-medium)",
          display: "flex", flexDirection: "column",
          padding: "32px 20px 20px 20px",
          boxSizing: "border-box", position: "relative",
          overflowY: "auto", border: "var(--modal-border)",
          ...commonFontStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <button
          onClick={handleCloseAndSave}
          aria-label="닫기"
          disabled={isCompleting}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 20, height: 20,
            background: "none", border: "none",
            cursor: isCompleting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0, opacity: isCompleting ? 0.5 : 1,
          }}
        >
          <X style={{ color: "var(--text-secondary)" }} width={20} height={20} />
        </button>

        {/* 헤더 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, marginBottom: 24, marginTop: 4, ...commonFontStyle,
        }}>
          <Music style={{ color: "var(--TURQUOISE)" }} width={24} height={24} />
          <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>
            오늘 {practiceTime} 연습
          </span>
        </div>

        {/* 메모 */}
        <textarea
          value={practiceNote}
          onChange={(e) => setPracticeNote(e.target.value)}
          placeholder="오늘의 연습 노트를 작성해보세요..."
          disabled={isCompleting}
          style={{
            width: "100%", height: 150,
            border: "0,7px solid var(--text-secondary)",
            borderRadius: "var(--border-radius-medium)",
            padding: 16, fontSize: 16,
            color: "var(--text-primary)", background: "var(--bg-primary)",
            resize: "none", outline: "none", boxSizing: "border-box",
            opacity: isCompleting ? 0.5 : 1,
            cursor: isCompleting ? "not-allowed" : "text", ...commonFontStyle,
          }}
        />

        {/* 버튼 영역 */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 20 }}>
          {/* 피퇴 버튼: Lottie 애니메이션 */}
          <button
            onClick={handleLikeClick}
            disabled={isCompleting}
            style={{
              width: 140, height: 35,
              background: "none", border: "none",
              borderRadius: "var(--border-radius-small)",
              cursor: isCompleting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, opacity: isCompleting ? 0.9 : 1,
              color: "var(--VIVA_MAGENTA)", ...commonFontStyle,
            }}
            aria-label="피퇴"
          >
            {!isLikeAnimating ? (
              // 기본 상태: Power 아이콘 + "피퇴" 텍스트
              <>
                <PowerIcon width={16} height={16} style={{ color: "currentColor" }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>피퇴</span>
              </>
            ) : (
              // 애니메이션 상태: Lottie (크기 225%, 미모사 색상)
              <div style={{ 
                width: 90, 
                height: 90,
                color: 'var(--MIMOSA)',
                filter: 'drop-shadow(0 0 0 var(--MIMOSA))'
              }}>
                <Lottie
                  lottieRef={lottieRef}
                  animationData={likeAnimation}
                  loop={false}
                  autoplay={true}
                  style={{ 
                    width: '100%', 
                    height: '100%'
                  }}
                  onComplete={handleLottieComplete}
                />
              </div>
            )}
          </button>

          {/* 시간 수정 버튼 */}
          <button
            onClick={() => { if (!isCompleting) { persistMemo(); onEditTime(); } }}
            disabled={isCompleting}
            style={{
              width: 140, height: 35,
              borderRadius: "var(--border-radius-small)",
              border: "none", background: "transparent",
              fontSize: 16, fontWeight: 600,
              cursor: isCompleting ? "not-allowed" : "pointer",
              transition: "color 0.2s ease",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, opacity: isCompleting ? 0.5 : 1, ...commonFontStyle,
              color: "var(--BLACK)",
            }}
          >
            <EditIcon width={16} height={16} />
            <span style={{ color: "currentColor" }}>시간 수정</span>
          </button>
        </div>
      </div>
    </div>
  );
}