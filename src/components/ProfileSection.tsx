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
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const renderCheerContent = () => {
    const baseStyle = {
      width: 250,
      height: 80,
      fontSize: 11,
      color: "#9e9c98",
      fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
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
                borderRadius: 8
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
                  borderRadius: 4,
                  flexShrink: 0
                }}
              />
              <span style={{ flex: 1, fontSize: 11, lineHeight: "16px" }}>
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
        width: "100%",
        maxWidth: 375,
        display: "flex",
        margin: "18px auto 0 auto",
        paddingLeft: 16,
        paddingRight: 16
      }}>
        {/* Profile + Nickname Container - 정확한 간격 7 */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Profile Avatar */}
          <div 
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              overflow: "hidden",
              background: avatar ? "transparent" : "#f9f9f9",
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
                  borderRadius: "24px",
                  objectFit: "cover",
                  display: "block"
                }}
              />
            ) : (
              <div style={{
                width: "80px",
                height: "80px",
                background: "#f9f9f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "24px"
              }}>
                <span style={{ 
                  fontSize: 12, 
                  color: "#9e9c98", 
                  textAlign: "center",
                  ...commonFontStyle
                }}>
                  프로필
                </span>
              </div>
            )}
          </div>

          {/* Nickname - 정확한 스펙 적용 */}
          <div style={{
            fontSize: 16,           // 글자크기 16
            lineHeight: "20px",     // 라인하이트 20
            color: "#2d2d2a",       // 제트블랙
            textAlign: "center",
            marginTop: 7,           // 버티컬 간격 7 (gap 제거)
            ...commonFontStyle
          }}>
            {nickname}
          </div>
        </div>

        {/* Cheer Content */}
        <div style={{
          marginLeft: 22,
          marginTop: 20,
          flex: 1
        }}>
          {renderCheerContent()}
        </div>
      </div>
    </>
  );
};

export default ProfileSection;
