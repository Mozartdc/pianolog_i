import React, { useState } from "react";

// SVG icon imports
import CheckIcon from "../assets/icons/check.svg?react";
import UncheckIcon from "../assets/icons/uncheck.svg?react";
import NumberPlusIcon from "../assets/icons/numberplus.svg?react";
import NumberMinusIcon from "../assets/icons/numberminus.svg?react";
import SongNoteIcon from "../assets/icons/song_note.svg?react";

interface PracticeItemProps {
  title: string;
  subtitle: string;
  checked: boolean;
  count: number;
  onCheck: () => void;
  onInc: () => void;
  onDec: () => void;
  onEdit?: (newTitle: string) => void;
  onDelete?: () => void;
  onTitleClick?: () => void;
  onCountClick?: () => void;
}

// Delete confirmation modal type
interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "var(--bg-primary)",
        borderRadius: "var(--border-radius-small)",
        padding: 24,
        width: "calc(100% - 32px)",
        maxWidth: 324,
        boxSizing: "border-box",
        border: "var(--border-light)",
        textAlign: "center"
      }}>
        <div style={{ marginBottom: 16, fontSize: 16, color: "var(--text-primary)" }}>
          <strong>"{title}"</strong> 곡을 정말 삭제하시겠습니까?
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: 40,
              background: "transparent",
              border: "none",
              borderRadius: "var(--border-radius-small)",
              fontSize: 16,
              color: "var(--VERY_PERI)",
              cursor: "pointer",
              fontFamily: "var(--FONT_FAMILY)"
            }}
          >
            cancle
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 40,
              background: "var(--VERY_PERI)",
              border: "none",
              borderRadius: "var(--border-radius-small)",
              fontSize: 16,
              color: "var(--button-primary-text)",
              cursor: "pointer",
              fontFamily: "var(--FONT_FAMILY)"
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PracticeItem({
  title,
  subtitle,
  checked,
  count,
  onCheck,
  onInc,
  onDec,
  onEdit,
  onDelete,
  onTitleClick,
  onCountClick
}: PracticeItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState("");

  const menuBtnStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 8px",
    background: "none",
    border: "none",
    textAlign: "left" as const,
    color: "var(--text-primary)",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "var(--FONT_FAMILY)",
  };

  const handleEditComplete = () => {
    const newTitle = editTitle.trim();
    if (newTitle && newTitle !== title && onEdit) {
      onEdit(newTitle);
    }
    setShowEditModal(false);
  };

  return (
    <>
      <div style={{
        width: "100%",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: 3,
        padding: 0
      }}>
        <div style={{
          width: "calc(100% - 32px)", 
          height: 56,
          border: "var(--border-light)",
          borderRadius: "var(--border-radius-medium)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-primary)",
          boxSizing: "border-box",
          padding: "0 16px",
          margin: "0 auto"
        }}>
          
          <div 
            onClick={(e) => { e.stopPropagation(); onCheck(); }}
            style={{ 
              width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", marginRight: 12,
              color: checked ? "var(--VERY_PERI)" : "var(--text-secondary)"
            }}
          >
            {checked ? <CheckIcon width={14} height={14} /> : <UncheckIcon width={14} height={14} />}
          </div>
          
          <div 
            style={{ flex: 1, minWidth: 0, cursor: onTitleClick ? "pointer" : "default" }}
            onClick={onTitleClick}
          >
            <div style={{
              fontSize: 16, color: "var(--text-primary)", fontFamily: "var(--FONT_FAMILY)",
              fontWeight: 400, lineHeight: "24px", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {title}
            </div>
            <div style={{
              fontSize: 14, color: "var(--text-secondary)",
              fontFamily: "var(--FONT_FAMILY)", lineHeight: "22px"
            }}>
              {subtitle}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--VERY_PERI)' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onDec(); }}
              style={{ 
                width: 24, height: 24, margin: "0 8px", background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                color: "inherit"
              }}
            >
              <NumberMinusIcon width={16} height={16} />
            </button>
            
            <span 
              onClick={onCountClick}
              style={{
                minWidth: 32, textAlign: "center", fontSize: 14,
                fontFamily: "var(--FONT_FAMILY)", lineHeight: "22px",
                cursor: onCountClick ? "pointer" : "default"
              }}
            >
              {count}
            </span>
            
            <button
              onClick={(e) => { e.stopPropagation(); onInc(); }}
              style={{ 
                width: 24, height: 24, margin: "0 8px", background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                color: "inherit"
              }}
            >
              <NumberPlusIcon width={16} height={16} />
            </button>
          </div>
          
          <div style={{ position: "relative", marginLeft: 4 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              aria-label="More options"
              style={{
                background: "none", border: "none", padding: 2, cursor: "pointer",
                borderRadius: 8, width: 16, height: 16,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <span style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: "16px", fontFamily: "monospace" }}>⋮</span>
            </button>
            
            {showMenu && (
              <div style={{
                position: "absolute", right: 0, top: 20, background: "var(--bg-primary)",
                border: "var(--border-light)", borderRadius: 6,
                boxShadow: "var(--shadow-light)", zIndex: 10, minWidth: 80
              }}>
                <button 
                  onClick={() => { setShowMenu(false); setEditTitle(title); setShowEditModal(true); }} 
                  style={menuBtnStyle}
                >
                  수정
                </button>
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    setDeleteTargetTitle(title);
                    setShowDeleteConfirm(true);
                  }} 
                  style={{ ...menuBtnStyle, color: "var(--VIVA_MAGENTA)" }}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        title={deleteTargetTitle}
        onConfirm={() => {
          if (onDelete) onDelete();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
        }}
      />

      {showEditModal && (
        <div 
          style={{
            position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => { setShowEditModal(false); }}
        >
          <div 
            style={{
              width: "calc(100% - 32px)", maxWidth: 324, height: "auto",
              maxHeight: "calc(100% - 64px)", background: "var(--bg-primary)",
              border: "var(--border-light)", borderRadius: "var(--border-radius-small)",
              boxSizing: "border-box", padding: 22, display: "flex",
              flexDirection: "column", overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, color: "var(--TURQUOISE)" }}>
              <SongNoteIcon width="16" height="16" />
              <span style={{ fontSize: 15, fontFamily: "var(--FONT_FAMILY)", color: 'var(--text-primary)'}}>
                연습곡 수정
              </span>
            </div>

            <div style={{ width: "100%", height: "0.5px", background: "var(--text-secondary)", marginBottom: 15 }} />

            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="여기에 곡명 입력"
              style={{
                width: "100%", height: 36, border: "var(--border-light)",
                borderRadius: "var(--border-radius-small)", padding: "0 12px",
                fontSize: 16, background: "var(--bg-secondary)",
                color: "var(--text-primary)", fontFamily: "var(--FONT_FAMILY)",
                marginBottom: 15, boxSizing: "border-box", outline: 'none'
              }}
              onKeyPress={(e) => { if (e.key === 'Enter') handleEditComplete(); }}
            />

            <div style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "var(--FONT_FAMILY)", marginBottom: 33 }}>
              곡 제목을 수정할 수 있습니다.
            </div>

            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              <button
                onClick={() => { setShowEditModal(false); setEditTitle(title); }}
                style={{
                  flex: 1, height: 43, background: "transparent", border: "none", fontSize: 16,
                  color: "var(--VERY_PERI)", cursor: "pointer", fontFamily: "var(--FONT_FAMILY)"
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleEditComplete}
                style={{
                  flex: 1, height: 43, background: "var(--VERY_PERI)", border: "none",
                  borderRadius: "var(--border-radius-small)", fontSize: 16,
                  color: "var(--button-primary-text)",
                  cursor: "pointer", fontFamily: "var(--FONT_FAMILY)"
                }}
              >
                수정완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}