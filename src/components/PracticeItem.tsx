import React, { useState } from "react";

// SVG 아이콘 import
import CheckIcon from "../assets/icons/check.svg?react";
import UncheckIcon from "../assets/icons/uncheck.svg?react";
import NumberPlusIcon from "../assets/icons/numberplus.svg?react";
import NumberMinusIcon from "../assets/icons/numberminus.svg?react";

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
  onTitleClick?: () => void;  // ✅ 추가
  onCountClick?: () => void;  // ✅ 추가
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
  onTitleClick,  // ✅ 추가
  onCountClick   // ✅ 추가
}: PracticeItemProps) {
  const [showMenu, setShowMenu] = useState(false);

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

  return (
    <div style={{
      width: "100%",
      maxWidth: 375,
      height: 80,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 0,
      margin: "0 auto"
    }}>
      <div style={{
        width: 343,
        height: 64,
        border: "0.5px solid #6667AB",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fff",
        boxSizing: "border-box",
        padding: "0 16px"
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
          onClick={onTitleClick}  // ✅ 곡명 클릭
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
          onClick={onCountClick}  // ✅ 숫자 클릭
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
                minWidth: 60
              }}
            >
              <button onClick={onEdit} style={menuBtnStyle}>
                수정
              </button>
              <button onClick={onDelete} style={menuBtnStyle}>
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
