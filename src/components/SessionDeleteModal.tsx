// src/components/SessionDeleteModal.tsx
import React from "react";
import DeleteIconSvg from '../assets/icons/delete.svg?react';

interface SessionDeleteModalProps {
  isOpen: boolean;
  sessionInfo: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const SessionDeleteModal: React.FC<SessionDeleteModalProps> = ({ 
  isOpen, 
  sessionInfo, 
  onConfirm, 
  onClose 
}) => {
  if (!isOpen) return null;

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", 
        justifyContent: "center", zIndex: 1000, padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-primary)", borderRadius: 12, padding: 24,
          width: "100%", maxWidth: 320, textAlign: "center", ...commonFontStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          fontSize: 18, color: "var(--text-primary)", marginBottom: 12, fontWeight: 600
        }}>
          연습 기록 삭제
        </div>
        
        <div style={{
          fontSize: 14, color: "var(--text-secondary)", marginBottom: 8
        }}>
          다음 기록을 삭제하시겠습니까?
        </div>
        
        <div style={{
          fontSize: 14, color: "var(--VIVA_MAGENTA)", marginBottom: 24,
          padding: "8px 12px", background: "var(--error-bg)", borderRadius: 8
        }}>
          {sessionInfo}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, 
              padding: "12px 20px", 
              borderRadius: 8, 
              border: "none",
              background: "transparent", 
              color: "var(--text-secondary)",
              fontSize: 14, 
              fontWeight: 600, 
              cursor: "pointer", 
              ...commonFontStyle
            }}
          >
            cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, 
              padding: "12px 20px", 
              borderRadius: 8, 
              border: "none",
              background: "transparent", 
              color: "var(--VIVA_MAGENTA)",
              fontSize: 14, 
              fontWeight: 600, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              ...commonFontStyle
            }}
          >
            <DeleteIconSvg width={16} height={16} />
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};