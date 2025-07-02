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
  onEdit?: () => void; // 이 onEdit 함수가 실제 상위 컴포넌트에서 제목 업데이트 로직을 처리해야 합니다.
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
    color: "#2D2D2A",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
  };

  const handleEditComplete = () => {
    // onEdit 함수가 상위 컴포넌트에서 제목을 업데이트하도록 호출
    // 여기서는 단순히 모달을 닫고, 상위 컴포넌트에서 실제로 'title' 상태를 변경하는 로직이 필요합니다.
    // 예를 들어, onEdit prop으로 `(newTitle: string) => void` 와 같은 함수를 받아서 호출해야 합니다.
    if (editTitle.trim() && editTitle.trim() !== title && onEdit) {
      // ✅ onEdit 함수를 호출할 때 수정된 제목을 인자로 전달해야 합니다.
      // 현재 onEdit()은 인자가 없으므로, 필요하다면 PracticeItemProps 인터페이스와
      // 상위 컴포넌트의 onEdit 구현을 수정해야 합니다.
      // 임시로 alert으로 변경된 제목을 표시합니다.
      alert(`곡 제목이 "${editTitle.trim()}"으로 수정될 예정입니다. (실제 적용은 상위 컴포넌트 로직 필요)`);
      onEdit(); // 이 부분은 상위 컴포넌트의 `handleEdit` 함수가 `editTitle`을 인자로 받을 수 있도록 변경해야 합니다.
    }
    setShowEditModal(false);
    setEditTitle(title); // 모달 닫을 때 원래 제목으로 되돌림 (수정 취소 시)
  };

  return (
    <>
      <div style={{
        width: "100%", // 부모 maxWidth: 375에 맞춰 100% 사용
        maxWidth: 375, // 이 컴포넌트가 최대로 차지할 너비
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: 0,
        padding: 0
      }}>
        <div style={{
          // ✅ 수정: 고정 343px 대신 calc(100% - 32px)를 사용하여 반응형으로 변경
          width: "calc(100% - 32px)", 
          maxWidth: 343, // 최대 너비는 343px 유지 (양 옆 16px 패딩 제외)
          height: 56,
          border: "0.5px solid #6667AB",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          boxSizing: "border-box",
          padding: "0 16px",
          margin: "0 auto" // 중앙 정렬
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
                {/* 수정 버튼 - 모달 열기 */}
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    setEditTitle(title); // 현재 제목으로 input 초기화
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

      {/* ✅ 수정 모달 - Today.tsx의 연습곡 추가와 동일한 반응형 디자인 적용 */}
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
          onClick={() => { /* setShowEditModal(false) */ }} // 모달 바깥 클릭 시 닫기 (선택적)
        >
          <div 
            style={{
              width: "calc(100% - 32px)", // 화면 여백 16px * 2 고려
              maxWidth: 324, // 최대 너비는 324px 유지
              height: "auto", // 높이는 콘텐츠에 따라 유동적으로
              maxHeight: "calc(100% - 64px)", // 화면 상하 여백 고려 (32px * 2)
              background: "#FFFFFF",
              border: "0.5px solid #6667AB",
              borderRadius: 5,
              boxSizing: "border-box",
              padding: 22,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto" // 내용이 넘치면 스크롤
            }}
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 전파 방지
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
              width: "100%", // ✅ 100%로 변경
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
                width: "100%", // ✅ 100%로 변경
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
              width: "100%" // ✅ 100%로 변경
            }}>
              {/* Cancel 버튼 */}
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditTitle(title); // 취소 시 원래 제목으로 되돌림
                }}
                style={{
                  flex: 1, // ✅ flex: 1로 변경
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
                  flex: 1, // ✅ flex: 1로 변경
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