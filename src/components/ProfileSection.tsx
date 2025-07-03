import React from "react";

interface ProfileSectionProps {
  avatar: string;
  nickname: string;
  cheerData: {
    type: 'text' | 'image' | 'textWithImage';
    message?: string;
    imageUrl?: string;
    imageAlt?: string;
  };
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ avatar, nickname, cheerData }) => {
  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const renderCheerContent = () => {
    const baseStyle = {
      // ✅ 완전 반응형: 고정 너비 제거
      width: "100%",
      height: 80,
      fontSize: 11,
      color: "var(--text-secondary)", // ✅ CSS 변수 적용
      fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
      lineHeight: "20px",
      textAlign: "left" as const,
      display: "flex",
      alignItems: "center"
    };

    switch (cheerData.type) {
      case 'image':
        return (
          <div style={baseStyle}>
            <img 
              src={cheerData.imageUrl} 
              alt={cheerData.imageAlt || "특별 이미지"}
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "contain",
                borderRadius: "var(--border-radius-medium)" // ✅ CSS 변수 적용
              }}
            />
          </div>
        );
      
      case 'textWithImage':
        return (
          <div style={baseStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%" }}>
              <img 
                src={cheerData.imageUrl} 
                alt={cheerData.imageAlt || "이미지"}
                style={{ 
                  width: 40, 
                  height: 40, 
                  objectFit: "contain",
                  borderRadius: "var(--border-radius-small)", // ✅ CSS 변수 적용
                  flexShrink: 0
                }}
              />
              <span style={{ 
                flex: 1, 
                fontSize: 11, 
                lineHeight: "16px",
                color: "var(--text-secondary)", // ✅ CSS 변수 적용
                fontFamily: "var(--FONT_FAMILY)" // ✅ CSS 변수 적용
              }}>
                {cheerData.message}
              </span>
            </div>
          </div>
        );
      
      case 'text':
      default:
        return (
          <div style={{...baseStyle, alignItems: "flex-start"}}>
            {cheerData.message}
          </div>
        );
    }
  };

  return (
    <>
      {/* Profile Section */}
      <div style={{
        // ✅ 완전 반응형: 고정 maxWidth 제거
        width: "calc(100% - 32px)", // 좌우 16px 패딩 고려
        display: "flex",
        margin: "18px auto 0 auto",
        boxSizing: "border-box" // ✅ 박스 사이징 명시
      }}>
        {/* Profile + Nickname Container */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0 // ✅ 프로필 영역 고정
        }}>
          {/* Profile Avatar */}
          <div 
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "var(--border-radius-large)", // ✅ CSS 변수 적용
              overflow: "hidden",
              background: avatar ? "transparent" : "var(--info-bg)", // ✅ CSS 변수 적용
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {avatar ? (
              <img 
                src={avatar} 
                alt="프로필" 
                style={{ 
                  width: "80px",
                  height: "80px",
                  borderRadius: "var(--border-radius-large)", // ✅ CSS 변수 적용
                  objectFit: "cover",
                  display: "block"
                }}
              />
            ) : (
              <div style={{
                width: "80px",
                height: "80px",
                background: "var(--info-bg)", // ✅ CSS 변수 적용
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--border-radius-large)" // ✅ CSS 변수 적용
              }}>
                <span style={{ 
                  fontSize: 12, 
                  color: "var(--text-secondary)", // ✅ CSS 변수 적용
                  textAlign: "center",
                  ...commonFontStyle
                }}>
                  프로필
                </span>
              </div>
            )}
          </div>

          {/* Nickname */}
          <div style={{
            fontSize: 16,
            lineHeight: "20px",
            color: "var(--text-primary)", // ✅ CSS 변수 적용
            textAlign: "center",
            marginTop: 7,
            ...commonFontStyle
          }}>
            {nickname}
          </div>
        </div>

        {/* Cheer Content */}
        <div style={{
          marginLeft: 22,
          marginTop: 20,
          flex: 1, // ✅ 남은 공간 모두 사용 (완전 반응형)
          minWidth: 0 // ✅ flex 아이템 축소 허용
        }}>
          {renderCheerContent()}
        </div>
      </div>
    </>
  );
};

export default ProfileSection;
