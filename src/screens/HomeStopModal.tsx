import React, { useState, useEffect, useRef } from "react";
import { Music, X } from "lucide-react";
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import EditIcon from "../assets/icons/edit.svg?react";
import PowerIcon from "../assets/icons/power.svg?react";
import likeAnimation from '../assets/like-animation.json';
import { usePracticeData } from "../contexts/PracticeDataContext";

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
  const { timerMemo, updateTimerMemo } = usePracticeData();
  const [practiceNote, setPracticeNote] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (isOpen) {
      setPracticeNote(timerMemo);
      setIsCompleting(false);
      setIsLikeAnimating(false);
    }
  }, [isOpen, timerMemo]);

  const persistMemo = () => {
    updateTimerMemo(practiceNote);
    console.log('📝 HomeStopModal: memo 저장 완료', practiceNote);
  };

  const handleCloseAndSave = () => {
    if (isCompleting || isLikeAnimating) return;
    persistMemo();
    onClose();
  };

  // Handle finish button click
  const handleLikeClick = () => {
    if (isCompleting || isLikeAnimating) return;
    
    setIsLikeAnimating(true);
    setIsCompleting(true);
    
    // Start Lottie animation - ensure it starts after slight delay
    setTimeout(() => {
      if (lottieRef.current) {
        lottieRef.current.goToAndStop(0, true);
        lottieRef.current.play();
      }
    }, 100);
  };

  // Handle Lottie animation completion
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
        {/* Close button */}
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

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, marginBottom: 24, marginTop: 4, ...commonFontStyle,
        }}>
          <Music style={{ color: "var(--TURQUOISE)" }} width={24} height={24} />
          <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>
            오늘 {practiceTime} 연습
          </span>
        </div>

        {/* Memo textarea */}
        <textarea
          value={practiceNote}
          onChange={(e) => setPracticeNote(e.target.value)}
          placeholder="오늘의 연습 노트를 작성해보세요..."
          disabled={isCompleting}
          style={{
            width: "100%", height: 150,
            border: "0.7px solid var(--text-secondary)",
            borderRadius: "var(--border-radius-medium)",
            padding: 16, fontSize: 16,
            color: "var(--text-primary)", background: "var(--bg-primary)",
            resize: "none", outline: "none", boxSizing: "border-box",
            opacity: isCompleting ? 0.5 : 1,
            cursor: isCompleting ? "not-allowed" : "text", ...commonFontStyle,
          }}
        />

        {/* Button area */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 20 }}>
          {/* Finish button: Lottie animation */}
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
              // Default state: Power icon + "피퇴" text
              <>
                <PowerIcon width={16} height={16} style={{ color: "currentColor" }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>피퇴</span>
              </>
            ) : (
              // Animation state: Lottie (225% size, mimosa color)
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

          {/* Edit time button */}
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
