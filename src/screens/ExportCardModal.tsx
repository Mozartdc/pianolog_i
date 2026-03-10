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

// Modified generateExportImage function to accept themeColors object as parameter
export const generateExportImage = async (
  nickname: string,
  date: string,
  practiceTime: string,
  avatar: string | undefined,
  themeColors: { [key: string]: string } // Object containing actual color values from current theme
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scale = 3;
      
      // New canvas size: 380 * 590 (full frame including shadow)
      const totalWidth = 380;
      const totalHeight = 590;
      // Actual card size: 360 * 570
      const cardWidth = 360;
      const cardHeight = 570;
      const shadowOffset = 10; // Margin for shadow
      
      canvas.width = totalWidth * scale;
      canvas.height = totalHeight * scale;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);

      // Set entire background to transparent
      ctx.clearRect(0, 0, totalWidth, totalHeight);

      // Create shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      // Draw card background (5px rounding)
      ctx.fillStyle = themeColors.bgPrimary || '#FFFFFF';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(shadowOffset, shadowOffset, cardWidth, cardHeight, 5);
        ctx.fill();
      } else {
        // fallback for older browsers
        ctx.fillRect(shadowOffset, shadowOffset, cardWidth, cardHeight);
      }

      // Remove shadow effect (don't apply shadow to subsequent elements)
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Calculate profile photo center coordinates (exact center within card)
      const cardCenterX = shadowOffset + (cardWidth / 2);
      const cardCenterY = shadowOffset + (cardHeight / 2);
      
      // Profile photo position (center of card)
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

      // 7. SVG icon + "오늘 피출 기록" (75px above profile photo top)
      const starImg = new window.Image();
      starImg.onload = () => {
        if (ctx) {
          const iconSize = 20;
          const text = '오늘 피출 기록';
          const gap = 5; // Gap between icon and text
          
          // Measure text width
          ctx.font = '12px Pretendard';
          const textWidth = ctx.measureText(text).width;
          
          // Calculate total group width
          const groupWidth = iconSize + gap + textWidth;
          
          // Group start X coordinate (center align in card)
          const groupStartX = cardCenterX - (groupWidth / 2);
          const groupY = profileY - 75; // 75px above profile photo top
          
          // Draw icon
          const iconX = groupStartX;
          const iconY = groupY - (iconSize / 2); // Vertical center align
          ctx.drawImage(starImg, iconX, iconY, iconSize, iconSize);
          
          // Draw text
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
            // 5. Logo image (170px below profile photo bottom)
            const logoWidth = 37;
            const logoHeight = 24;
            const logoX = cardCenterX - (logoWidth / 2); // Center align
            const logoY = profileY + profileSize + 170; // 170px below profile photo bottom
            
            ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
            
            // 6. "digital piano gallery" text (200px below profile photo bottom)
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
            // Show only text if logo fails to load
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

        // 1. Profile photo (center of card)
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
          
          // 2. Nickname (5px below profile photo bottom)
          const nicknameY = profileY + profileSize + 5 + 24; // +24 considers font height
          ctx.fillStyle = themeColors.textPrimary || '#2D2D2A';
          ctx.font = 'bold 24px Pretendard';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(nickname, cardCenterX, nicknameY);

          // 3. Today's date (55px below profile photo bottom)
          const dateY = profileY + profileSize + 55 + 16; // +16 considers font height
          ctx.fillStyle = themeColors.textSecondary || '#9E9C98';
          ctx.font = '16px Pretendard';
          ctx.fillText(date, cardCenterX, dateY);

          // 4. Practice time (80px below profile photo bottom)
          const timeY = profileY + profileSize + 80 + 48; // +48 considers font height
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
      // Read current theme CSS variable values
      const rootStyle = getComputedStyle(document.documentElement);
      const themeColors = {
        bgPrimary: rootStyle.getPropertyValue('--bg-primary').trim(),
        textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
        textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
        turquoise: rootStyle.getPropertyValue('--TURQUOISE').trim(),
        borderLight: rootStyle.getPropertyValue('--border-light').trim().split(' ')[2] || '#E0E0E0' // Extract color from '0.5px solid #E0E0E0'
      };
      
      // Pass the color values to generateExportImage function
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
          // Modified modal UI to also use CSS variables
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