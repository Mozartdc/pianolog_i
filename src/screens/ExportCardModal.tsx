import React, { useState, useEffect, useRef } from "react";
import StarIcon from "../assets/icons/star.svg?url";
import LogoImg from "../utils/img/logo.png";

interface ExportCardModalProps {
  isOpen: boolean;
  nickname: string;
  date: string;
  practiceTime: string;
  avatar?: string;
  onClose: () => void;
}

// ✅ [수정] generateExportImage 함수가 themeColors 객체를 인자로 받도록 변경
export const generateExportImage = async (
  nickname: string,
  date: string,
  practiceTime: string,
  avatar: string | undefined,
  themeColors: { [key: string]: string } // 현재 테마의 실제 색상 값들을 담을 객체
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scale = 3;
      
      // ✅ 새로운 캔버스 사이즈: 380 * 590 (그림자 포함한 전체 프레임)
      const totalWidth = 380;
      const totalHeight = 590;
      // ✅ 실제 카드 사이즈: 360 * 570
      const cardWidth = 360;
      const cardHeight = 570;
      const shadowOffset = 10; // 그림자를 위한 여백
      
      canvas.width = totalWidth * scale;
      canvas.height = totalHeight * scale;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);

      // ✅ 전체 배경을 투명하게 설정
      ctx.clearRect(0, 0, totalWidth, totalHeight);

      // ✅ 그림자 효과 생성
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      // ✅ 카드 배경 그리기 (5px 라운딩)
      ctx.fillStyle = themeColors.bgPrimary || '#FFFFFF';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(shadowOffset, shadowOffset, cardWidth, cardHeight, 5);
        ctx.fill();
      } else {
        // fallback for older browsers
        ctx.fillRect(shadowOffset, shadowOffset, cardWidth, cardHeight);
      }

      // ✅ 그림자 효과 제거 (이후 요소들에는 그림자 적용 안함)
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // ✅ 프로필 사진 중앙 좌표 계산 (카드 내에서의 정중앙)
      const cardCenterX = shadowOffset + (cardWidth / 2);
      const cardCenterY = shadowOffset + (cardHeight / 2);
      
      // ✅ 프로필 사진 위치 (카드의 정중앙)
      const profileSize = 80;
      const profileX = cardCenterX - (profileSize / 2);
      const profileY = cardCenterY - (profileSize / 2);

      let finished = false;
      const safeResolve = (url: string) => {
        if (!finished) { finished = true; resolve(url); }
      };
      const safeReject = (err: any) => {
        if (!finished) { finished = true; reject(err); }
      };

      // ✅ 7. SVG 아이콘 + "오늘 피출 기록" (프로필 사진 상단에서 위로 75px)
      const starImg = new window.Image();
      starImg.onload = () => {
        if (ctx) {
          const iconSize = 20;
          const text = '오늘 피출 기록';
          const gap = 5; // 아이콘과 텍스트 간격
          
          // 텍스트 너비 측정
          ctx.font = '12px Pretendard';
          const textWidth = ctx.measureText(text).width;
          
          // 전체 그룹 너비 계산
          const groupWidth = iconSize + gap + textWidth;
          
          // 그룹의 시작 X 좌표 (카드 중앙 정렬)
          const groupStartX = cardCenterX - (groupWidth / 2);
          const groupY = profileY - 75; // 프로필 사진 상단에서 위로 75px
          
          // 아이콘 그리기
          const iconX = groupStartX;
          const iconY = groupY - (iconSize / 2); // 수직 중앙 정렬
          ctx.drawImage(starImg, iconX, iconY, iconSize, iconSize);
          
          // 텍스트 그리기
          ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
          ctx.font = '12px Pretendard';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, iconX + iconSize + gap, groupY);
        }
        drawLogoAndContent();
      };
      starImg.onerror = () => {
        safeReject(new Error('StarIcon failed to load. Check the path and file.'));
      };
      starImg.src = StarIcon;

      function drawLogoAndContent() {
        const logoImg = new window.Image();
        logoImg.onload = () => {
          if (ctx) {
            // ✅ 5. 로고 이미지 (프로필 사진 하단에서 아래로 170px)
            const logoWidth = 37;
            const logoHeight = 24;
            const logoX = cardCenterX - (logoWidth / 2); // 중앙 정렬
            const logoY = profileY + profileSize + 170; // 프로필 사진 하단에서 170px 아래
            
            ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
            
            // ✅ 6. "digital piano gallery" 텍스트 (프로필 사진 하단에서 아래로 200px)
            ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
            ctx.font = '12px Pretendard';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('digital piano gallery', cardCenterX, profileY + profileSize + 200);
          }
          drawProfileAndTexts();
        };
        logoImg.onerror = () => {
          if (ctx) {
            // 로고 로드 실패 시 텍스트만 표시
            ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
            ctx.font = '12px Pretendard';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('digital piano gallery', cardCenterX, profileY + profileSize + 200);
          }
          drawProfileAndTexts();
        };
        logoImg.src = LogoImg as string;
      }

      function drawProfileAndTexts() {
        if (!ctx) { safeReject(new Error('Canvas context not available')); return; }

        // ✅ 1. 프로필 사진 (카드의 정중앙)
        if (avatar) {
          const avatarImg = new window.Image();
          avatarImg.onload = () => {
            if (ctx) {
              ctx.save();
              const radius = 24;
              if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(profileX, profileY, profileSize, profileSize, radius);
                ctx.clip();
              }
              ctx.drawImage(avatarImg, profileX, profileY, profileSize, profileSize);
              ctx.restore();
            }
            drawTexts();
          };
          avatarImg.onerror = () => { drawDefaultProfile(); };
          avatarImg.src = avatar;
        } else {
          drawDefaultProfile();
        }

        function drawDefaultProfile() {
          if (ctx) {
            const radius = 24;
            ctx.strokeStyle = themeColors.borderLight || '#E0E0E0';
            ctx.lineWidth = 2;
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(profileX, profileY, profileSize, profileSize, radius);
              ctx.stroke();
            }
          }
          drawTexts();
        }

        function drawTexts() {
          if (!ctx) { safeReject(new Error('Canvas context not available')); return; }
          
          ctx.textAlign = 'center';
          
          // ✅ 2. 닉네임 (프로필 사진 하단에서 아래로 5px)
          const nicknameY = profileY + profileSize + 5 + 24; // +24는 폰트 높이 고려
          ctx.fillStyle = themeColors.textPrimary || '#2D2D2A';
          ctx.font = 'bold 24px Pretendard';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(nickname, cardCenterX, nicknameY);

          // ✅ 3. 오늘 날짜 (프로필 사진 하단에서 아래로 55px)
          const dateY = profileY + profileSize + 55 + 16; // +16은 폰트 높이 고려
          ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
          ctx.font = '16px Pretendard';
          ctx.fillText(date, cardCenterX, dateY);

          // ✅ 4. 피출 시간 (프로필 사진 하단에서 아래로 80px)
          const timeY = profileY + profileSize + 80 + 48; // +48은 폰트 높이 고려
          const hourMatch = practiceTime.match(/(\d+)시간/);
          const minuteMatch = practiceTime.match(/(\d+)분/);
          let hourNum = hourMatch ? hourMatch[1] : null;
          let minNum = minuteMatch ? minuteMatch[1] : null;
          let totalWidth = 0;
          let currentX = 0;
          const tempFontBold = 'bold 48px Pretendard';
          const tempFontLight = '300 48px Pretendard';

          if (hourNum !== null) {
            ctx.font = tempFontBold; totalWidth += ctx.measureText(hourNum).width;
            ctx.font = tempFontLight; totalWidth += ctx.measureText('시간').width;
          }
          if (minNum !== null) {
            if (hourNum !== null) totalWidth += 5;
            ctx.font = tempFontBold; totalWidth += ctx.measureText(minNum).width;
            ctx.font = tempFontLight; totalWidth += ctx.measureText('분').width;
          } else if (hourNum === null && minNum === null) {
              safeResolve(canvas.toDataURL('image/png', 1.0)); return;
          }

          currentX = cardCenterX - (totalWidth / 2);
          ctx.textAlign = 'left';

          if (hourNum !== null) {
            ctx.fillStyle = themeColors.turquoise || '#45B5AA';
            ctx.font = tempFontBold;
            ctx.fillText(hourNum, currentX, timeY);
            currentX += ctx.measureText(hourNum).width;

            ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
            ctx.font = tempFontLight;
            ctx.fillText('시간', currentX, timeY);
            currentX += ctx.measureText('시간').width;
          }

          if (minNum !== null) {
            if (hourNum !== null) currentX += 5;
            ctx.fillStyle = themeColors.turquoise || '#45B5AA';
            ctx.font = tempFontBold;
            ctx.fillText(minNum, currentX, timeY);
            currentX += ctx.measureText(minNum).width;

            ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
            ctx.font = tempFontLight;
            ctx.fillText('분', currentX, timeY);
          }
          safeResolve(canvas.toDataURL('image/png', 1.0));
        }
      }
    } catch (err) {
      reject(err);
    }
  });
};

const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function ExportCardModal({ 
  isOpen, 
  nickname,
  date, 
  practiceTime, 
  avatar,
  onClose 
}: ExportCardModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !hasExecutedRef.current) {
      hasExecutedRef.current = true;
      generateAndDownload();
    }
    if (!isOpen) {
      hasExecutedRef.current = false;
    }
  }, [isOpen]);

  const generateAndDownload = async () => {
    if (hasExecutedRef.current !== true) return;
    setIsLoading(true);
    try {
      // ✅ [수정] 현재 테마의 CSS 변수 값을 읽어옵니다.
      const rootStyle = getComputedStyle(document.documentElement);
      const themeColors = {
        bgPrimary: rootStyle.getPropertyValue('--bg-primary').trim(),
        textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
        textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
        turquoise: rootStyle.getPropertyValue('--TURQUOISE').trim(),
        borderLight: rootStyle.getPropertyValue('--border-light').trim().split(' ')[2] || '#E0E0E0' // '0.5px solid #E0E0E0'에서 색상만 추출
      };
      
      // ✅ [수정] 읽어온 색상 값을 generateExportImage 함수에 전달합니다.
      const dataUrl = await generateExportImage(nickname, date, practiceTime, avatar, themeColors); 
      const filename = `피출기록_${date.replace(/\./g, '').replace(/\s/g, '_')}_${nickname}.png`;
      downloadImage(dataUrl, filename);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(45, 45, 42, 0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          // ✅ [수정] 모달 UI도 CSS 변수를 사용하도록 변경
          background: "var(--bg-primary)",
          borderRadius: 8,
          padding: "40px",
          textAlign: "center",
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
        }}
        onClick={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div>
            <div style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 16 }}>
              이미지 생성 중...
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              잠시만 기다려주세요
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 18, color: "var(--TURQUOISE)", marginBottom: 16 }}>
              다운로드 완료!
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              피출 카드가 저장되었습니다
            </div>
          </div>
        )}
      </div>
    </div>
  );
}