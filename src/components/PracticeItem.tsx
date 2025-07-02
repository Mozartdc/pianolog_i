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
  const [showEditModal, setShowEditModal] = useState(false); // ✅ 수정 모달 상태
  const [editTitle, setEditTitle] = useState(title); // ✅ 수정할 제목

  const menuBtnStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 8px",
    background: "none",
    border: "none",
    textAlign: "left" as const,
    color: "#2D2D2A",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
  };

  // ✅ 수정 완료 핸들러
  const handleEditComplete = () => {
    if (editTitle.trim() && editTitle.trim() !== title && onEdit) {
      // 실제로는 상위 컴포넌트에서 곡 제목 업데이트 처리
      onEdit();
    }
    setShowEditModal(false);
    setEditTitle(title);
  };

  return (
    <>
      <div style={{
        width: "100%",
        maxWidth: 375,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: 0,
        padding: 0
      }}>
        <div style={{
          width: 343,
          height: 56,
          border: "0.5px solid #6667AB",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          boxSizing: "border-box",
          padding: "0 16px",
          margin: 0
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
              color: "#2D2D2A",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
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
              color: "#9E9C98",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
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
              color: "#6667AB",
              fontSize: 14,
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
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
                color: "#9E9C98", 
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
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  zIndex: 10,
                  minWidth: 80
                }}
              >
                {/* ✅ 수정 버튼 - 모달 열기 */}
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
                    color: "#bb2649"
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ 수정 모달 - Today.tsx의 연습곡 추가와 동일한 디자인 */}
      {showEditModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div 
            style={{
              width: 324,
              height: 249,
              background: "#FFFFFF",
              border: "0.5px solid #6667AB",
              borderRadius: 5,
              boxSizing: "border-box",
              padding: 22,
              display: "flex",
              flexDirection: "column"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더: 연습곡 수정 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <img src={SongNoteIcon} alt="song note" width="16" height="16" />
              <span style={{
                fontSize: 15,
                color: "#2D2D2A",
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
              }}>
                연습곡 수정
              </span>
            </div>

            {/* 라인 */}
            <div style={{
              width: 280,
              height: "0.5px",
              background: "#9E9C98",
              marginBottom: 15
            }} />

            {/* 입력창 */}
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="여기에 곡명 입력"
              style={{
                width: 270,
                height: 36,
                border: "1px solid #E5E5E5",
                borderRadius: 4,
                padding: "0 12px",
                fontSize: 16,
                color: "#2D2D2A",
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
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
              color: "#9E9C98",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
              marginBottom: 33
            }}>
              곡 제목을 수정할 수 있습니다.
            </div>

            {/* 버튼 영역 */}
            <div style={{
              display: "flex",
              gap: 8,
              width: 280
            }}>
              {/* Cancel 버튼 */}
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditTitle(title);
                }}
                style={{
                  width: 137,
                  height: 43,
                  background: "transparent",
                  border: "none",
                  fontSize: 16,
                  color: "#6667AB",
                  cursor: "pointer",
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
                }}
              >
                Cancel
              </button>

              {/* 수정완료 버튼 */}
              <button
                onClick={handleEditComplete}
                style={{
                  width: 137,
                  height: 43,
                  background: "#6667AB",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 16,
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
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