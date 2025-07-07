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
      const width = 360;
      const height = 435;
      canvas.width = width * scale;
      canvas.height = height * scale;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);

      // ✅ [수정] 하드코딩된 색상 대신 themeColors 객체의 값을 사용
      ctx.fillStyle = themeColors.bgPrimary || '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      let finished = false;
      const safeResolve = (url: string) => {
        if (!finished) { finished = true; resolve(url); }
      };
      const safeReject = (err: any) => {
        if (!finished) { finished = true; reject(err); }
      };

// 별 아이콘
const starImg = new window.Image();
starImg.onload = () => {
  if (ctx) {
    const iconX = 30;
    const iconY = 30;
    const iconSize = 20;
    ctx.drawImage(starImg, iconX, iconY, iconSize, iconSize);

    ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
    ctx.font = '12px Pretendard';
    ctx.textAlign = 'left';
    // ✅ 텍스트를 아이콘의 세로 중앙에 맞춥니다.
    ctx.textBaseline = 'middle';
    // ✅ 아이콘 오른쪽으로 3px 간격을 두고 텍스트를 그립니다.
    ctx.fillText('오늘 피출 기록', iconX + iconSize + 3, iconY + iconSize / 2);
  }
  drawLogoAndContent();
};
// ✅ 로드 실패 시 에러를 명확히 알립니다.
starImg.onerror = () => {
  safeReject(new Error('StarIcon failed to load. Check the path and file.'));
};
starImg.src = StarIcon; // 'as string' 캐스팅은 이제 필요 없습니다.

function drawLogoAndContent() {
        const logoImg = new window.Image();
        logoImg.onload = () => {
          if (ctx) {
            const logoX = 30;
            const logoWidth = 37;
            const logoHeight = 24;
            const text = 'digital piano gallery';
            
            // ✅ 두 요소를 정렬할 기준 Y 좌표를 계산합니다.
            const verticalCenterY = 385;

            // ✅ 로고를 그립니다. (Y 좌표를 중앙 기준으로 재조정)
            ctx.drawImage(logoImg, logoX, verticalCenterY - (logoHeight / 2), logoWidth, logoHeight);
            
            ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
            ctx.font = '12px Pretendard';
            ctx.textAlign = 'left';
            // ✅ 텍스트의 세로 정렬 기준을 'middle'로 설정합니다.
            ctx.textBaseline = 'middle';
            // ✅ 로고 오른쪽으로 간격을 두고, 동일한 Y 좌표 기준으로 텍스트를 그립니다.
            ctx.fillText(text, logoX + logoWidth + 5, verticalCenterY);
          }
          drawProfileAndTexts();
        };
        logoImg.onerror = () => {
          if (ctx) {
            // ... 로고 로드 실패 시의 로직은 동일 ...
            ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
            ctx.font = '12px Pretendard';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('digital piano gallery', 30, 385);
          }
          drawProfileAndTexts();
        };
        logoImg.src = LogoImg as string;
      }
      function drawProfileAndTexts() {
        if (!ctx) { safeReject(new Error('Canvas context not available')); return; }
        const profileX = 140;
        const profileY = 130;
        const profileSize = 80;
        const centerX = 180;

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
          ctx.textBaseline = 'alphabetic';
          const avatarBottom = profileY + profileSize;
          const nicknameY = avatarBottom + 24;
          ctx.fillStyle = themeColors.textPrimary || '#2D2D2A';
          ctx.font = 'bold 24px Pretendard';
          ctx.textAlign = 'center';
          ctx.fillText(nickname, centerX, nicknameY);

          const dateY = nicknameY + 22 + 16;
          ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
          ctx.font = '16px Pretendard';
          ctx.fillText(date, centerX, dateY);

          const timeY = dateY + 6 + 48;
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

          currentX = centerX - (totalWidth / 2);
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