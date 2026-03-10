// src/components/SessionMemoModal.tsx
import React, { useState, useEffect } from "react";
import SaveIcon from "../assets/icons/save2.svg?react";

interface SessionMemoModalProps {
  isOpen: boolean;
  currentMemo: string;
  onSave: (memo: string) => void;
  onClose: () => void;
}

export const SessionMemoModal: React.FC<SessionMemoModalProps> = ({
  isOpen,
  currentMemo,
  onSave,
  onClose
}) => {
  const [memo, setMemo] = useState(currentMemo);

  useEffect(() => {
    if (isOpen) {
      setMemo(currentMemo);
    }
  }, [isOpen, currentMemo]);

  if (!isOpen) return null;

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const handleSave = () => {
    onSave(memo.trim());
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "var(--modal-backdrop-home)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: "40px 0px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: 8,
          width: "100%-32px",
          minHeight: 320,
          maxHeight: "80vh",
          boxShadow: "var(--shadow-medium)",
          display: "flex",
          flexDirection: "column",
          padding: "32px 20px 20px 20px",
          boxSizing: "border-box",
          position: "relative",
          overflowY: "auto",
          border: "var(--modal-border)",
          ...commonFontStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 24,
          marginTop: 4,
          ...commonFontStyle
        }}>
          <span style={{ 
            fontSize: 20, 
            fontWeight: 600, 
            color: "var(--text-primary)" 
          }}>
            메모 편집
          </span>
        </div>

        {/* Memo input area */}
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="연습 내용이나 느낀 점을 기록해보세요..."
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
            ...commonFontStyle
          }}
          maxLength={200}
        />

        {/* Character count display */}
        <div style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          textAlign: "right",
          marginTop: 8,
          marginBottom: 20
        }}>
          {memo.length}/200
        </div>

        {/* Same button style as HomeStopModal */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          gap: 12, 
          marginTop: "auto"
        }}>
          {/* Cancel button - left, no icon */}
          <button
            onClick={onClose}
            style={{
              width: 140,
              height: 35,
              borderRadius: "var(--border-radius-small)",
              border: "none",
              background: "transparent",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "color 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              ...commonFontStyle,
              color: "var(--text-primary)",
            }}
          >
            <span style={{ color: "currentColor" }}>cancel</span>
          </button>

          {/* Save button - right, includes Save2 icon */}
          <button
            onClick={handleSave}
            style={{
              width: 140,
              height: 35,
              background: "none",
              border: "none",
              borderRadius: "var(--border-radius-small)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: "var(--VIVA_MAGENTA)",
              ...commonFontStyle,
            }}
          >
            <SaveIcon width={16} height={16} style={{ color: "currentColor" }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>등록</span>
          </button>
        </div>
      </div>
    </div>
  );
};