import React, { useState } from "react";

// SVG 아이콘 import
import CheckIcon from "../assets/icons/check.svg?react";
import UncheckIcon from "../assets/icons/uncheck.svg?react";
import NumberPlusIcon from "../assets/icons/numberplus.svg?react";
import NumberMinusIcon from "../assets/icons/numberminus.svg?react";
import SongNoteIcon from "../assets/icons/song_note.svg";

interface PracticeItemProps {
  title: string;
  subtitle: string;
  checked: boolean;
  count: number;
  onCheck: () => void;
  onInc: () => void;
  onDec: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTitleClick?: () => void;
  onCountClick?: () => void;
}

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

  const menuBtnStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 8px",
    background: "none",
    border: "none",
    textAlign: "left" as const,
    color: "var(--text-primary)", // ✅ CSS 변수 적용
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
  };

  const handleEditComplete = () => {
    if (editTitle.trim() && editTitle.trim() !== title && onEdit) {
      alert(`곡 제목이 "${editTitle.trim()}"으로 수정될 예정입니다. (실제 적용은 상위 컴포넌트 로직 필요)`);
      onEdit();
    }
    setShowEditModal(false);
    setEditTitle(title);
  };

  return (
    <>
      <div style={{
        width: "100%",
        // ✅ maxWidth 제거 - 완전 반응형
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: 0,
        padding: 0
      }}>
        <div style={{
          // ✅ 완전 반응형: 고정 maxWidth 제거
          width: "calc(100% - 32px)", 
          height: 56,
          border: "var(--border-light)", // ✅ CSS 변수 적용
          borderRadius: "var(--border-radius-medium)", // ✅ CSS 변수 적용
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-primary)", // ✅ CSS 변수 적용
          boxSizing: "border-box",
          padding: "0 16px",
          margin: "0 auto"
        }}>
          
          {/* 체크박스 */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onCheck();
            }}
            style={{ 
              width: 24, 
              height: 24, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              cursor: "pointer",
              marginRight: 12,
              background: "transparent"
            }}
          >
            {checked ? (
              <CheckIcon width={14} height={14} />
            ) : (
              <UncheckIcon width={14} height={14} />
            )}
          </div>
          
          {/* 곡 정보 - 클릭 가능 */}
          <div 
            style={{ 
              flex: 1, 
              minWidth: 0, 
              cursor: onTitleClick ? "pointer" : "default" 
            }}
            onClick={onTitleClick}
          >
            <div style={{
              fontSize: 16,
              color: "var(--text-primary)", // ✅ CSS 변수 적용
              fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
              fontWeight: 400,
              lineHeight: "24px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {title}
            </div>
            <div style={{
              fontSize: 14,
              color: "var(--text-secondary)", // ✅ CSS 변수 적용
              fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
              lineHeight: "22px"
            }}>
              {subtitle}
            </div>
          </div>
          
          {/* - 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDec();
            }}
            style={{ 
              width: 24, 
              height: 24, 
              margin: "0 8px", 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            }}
          >
            <NumberMinusIcon width={16} height={16} />
          </button>
          
          {/* 반복횟수 - 클릭 가능 */}
          <span 
            onClick={onCountClick}
            style={{
              minWidth: 32,
              textAlign: "center" as const,
              color: "var(--VERY_PERI)", // ✅ CSS 변수 적용
              fontSize: 14,
              fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
              lineHeight: "22px",
              cursor: onCountClick ? "pointer" : "default"
            }}
          >
            {count}
          </span>
          
          {/* + 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInc();
            }}
            style={{ 
              width: 24, 
              height: 24, 
              margin: "0 8px", 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            }}
          >
            <NumberPlusIcon width={16} height={16} />
          </button>
          
          {/* 더보기 메뉴 */}
          <div style={{ position: "relative", marginLeft: 4 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              aria-label="더보기"
              style={{
                background: "none",
                border: "none",
                padding: 2,
                cursor: "pointer",
                borderRadius: 8,
                width: 16,
                height: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span style={{ 
                fontSize: 16,
                color: "var(--text-secondary)", // ✅ CSS 변수 적용
                lineHeight: "16px",
                fontFamily: "monospace"
              }}>⋮</span>
            </button>
            
            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 20,
                  background: "var(--bg-primary)", // ✅ CSS 변수 적용
                  border: "var(--border-light)", // ✅ CSS 변수 적용
                  borderRadius: 6,
                  boxShadow: "var(--shadow-light)", // ✅ CSS 변수 적용
                  zIndex: 10,
                  minWidth: 80
                }}
              >
                {/* 수정 버튼 - 모달 열기 */}
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    setEditTitle(title);
                    setShowEditModal(true);
                  }} 
                  style={menuBtnStyle}
                >
                  수정
                </button>
                
                {/* 삭제 버튼 */}
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    if (onDelete) {
                      if (confirm(`"${title}" 곡을 정말 삭제하시겠습니까?`)) {
                        onDelete();
                      }
                    }
                  }} 
                  style={{
                    ...menuBtnStyle,
                    color: "var(--VIVA_MAGENTA)" // ✅ CSS 변수 적용
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {showEditModal && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => { /* setShowEditModal(false) */ }}
        >
          <div 
            style={{
              width: "calc(100% - 32px)",
              maxWidth: 324, // 모달은 최대 크기 유지
              height: "auto",
              maxHeight: "calc(100% - 64px)",
              background: "var(--bg-primary)", // ✅ CSS 변수 적용
              border: "var(--border-light)", // ✅ CSS 변수 적용
              borderRadius: "var(--border-radius-small)", // ✅ CSS 변수 적용
              boxSizing: "border-box",
              padding: 22,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더: 연습곡 수정 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <img src={SongNoteIcon} alt="song note" width="16" height="16" />
              <span style={{
                fontSize: 15,
                color: "var(--text-primary)", // ✅ CSS 변수 적용
                fontFamily: "var(--FONT_FAMILY)" // ✅ CSS 변수 적용
              }}>
                연습곡 수정
              </span>
            </div>

            {/* 라인 */}
            <div style={{
              width: "100%",
              height: "0.5px",
              background: "var(--text-secondary)", // ✅ CSS 변수 적용
              marginBottom: 15
            }} />

            {/* 입력창 */}
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="여기에 곡명 입력"
              style={{
                width: "100%",
                height: 36,
                border: "var(--border-light)", // ✅ CSS 변수 적용
                borderRadius: "var(--border-radius-small)", // ✅ CSS 변수 적용
                padding: "0 12px",
                fontSize: 16,
                color: "var(--text-primary)", // ✅ CSS 변수 적용
                fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
                marginBottom: 15,
                boxSizing: "border-box"
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEditComplete();
                }
              }}
            />

            {/* 안내 텍스트 */}
            <div style={{
              fontSize: 14,
              color: "var(--text-secondary)", // ✅ CSS 변수 적용
              fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
              marginBottom: 33
            }}>
              곡 제목을 수정할 수 있습니다.
            </div>

            {/* 버튼 영역 */}
            <div style={{
              display: "flex",
              gap: 8,
              width: "100%"
            }}>
              {/* Cancel 버튼 */}
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditTitle(title);
                }}
                style={{
                  flex: 1,
                  height: 43,
                  background: "transparent",
                  border: "none",
                  fontSize: 16,
                  color: "var(--VERY_PERI)", // ✅ CSS 변수 적용
                  cursor: "pointer",
                  fontFamily: "var(--FONT_FAMILY)" // ✅ CSS 변수 적용
                }}
              >
                Cancel
              </button>

              {/* 수정완료 버튼 */}
              <button
                onClick={handleEditComplete}
                style={{
                  flex: 1,
                  height: 43,
                  background: "var(--VERY_PERI)", // ✅ CSS 변수 적용
                  border: "none",
                  borderRadius: "var(--border-radius-small)", // ✅ CSS 변수 적용
                  fontSize: 16,
                  color: "var(--WHITE)", // ✅ CSS 변수 적용
                  cursor: "pointer",
                  fontFamily: "var(--FONT_FAMILY)" // ✅ CSS 변수 적용
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
