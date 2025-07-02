import React, { useState, useEffect, useRef } from "react";
import StarIcon from "../assets/icons/star.svg";
import LogoImg from "../utils/img/logo.png"; // 이 경로가 올바른지 확인해주세요.

interface ExportCardModalProps {
  isOpen: boolean;
  nickname: string;
  date: string;
  practiceTime: string;
  avatar?: string;
  onClose: () => void;
}

export const generateExportImage = async (
  nickname: string,
  date: string,
  practiceTime: string,
  avatar?: string
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
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      let finished = false;
      const safeResolve = (url: string) => {
        if (!finished) {
          finished = true;
          resolve(url);
        }
      };
      const safeReject = (err: any) => {
        if (!finished) {
          finished = true;
          reject(err);
        }
      };

      // 별 아이콘
      const starImg = new window.Image();
      starImg.onload = () => {
        if (ctx) {
          ctx.drawImage(starImg, 30, 30, 24, 24);
          ctx.fillStyle = '#9E9C98';
          ctx.font = '12px Pretendard';
          ctx.textAlign = 'left';
          ctx.fillText('오늘 피출 기록', 57, 45);
        }
        drawLogoAndContent();
      };
      starImg.onerror = () => {
        if (ctx) {
          ctx.fillStyle = '#9E9C98';
          ctx.font = '12px Pretendard';
          ctx.textAlign = 'left';
          ctx.fillText('오늘 피출 기록', 30, 45);
        }
        drawLogoAndContent();
      };
      starImg.src = StarIcon as string;

      function drawLogoAndContent() {
        const logoImg = new window.Image();
        logoImg.onload = () => {
          if (ctx) {
            ctx.drawImage(logoImg, 30, 365, 37, 39);
            ctx.fillStyle = '#9E9C98';
            ctx.font = '12px Pretendard';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('digital piano gallery', 72, 385);
          }
          drawProfileAndTexts();
        };
        logoImg.onerror = () => {
          if (ctx) {
            ctx.fillStyle = '#9E9C98';
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
        if (!ctx) {
          safeReject(new Error('Canvas context not available'));
          return;
        }
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
          avatarImg.onerror = () => {
            drawDefaultProfile();
          };
          avatarImg.src = avatar;
        } else {
          drawDefaultProfile();
        }

        function drawDefaultProfile() {
          if (ctx) {
            const radius = 24;
            ctx.strokeStyle = '#E0E0E0';
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
          if (!ctx) {
            safeReject(new Error('Canvas context not available'));
            return;
          }
          ctx.textBaseline = 'alphabetic';
          const avatarBottom = profileY + profileSize;
          // 닉네임
          const nicknameY = avatarBottom + 24;
          ctx.fillStyle = '#2D2D2A';
          ctx.font = 'bold 24px Pretendard';
          ctx.textAlign = 'center';
          ctx.fillText(nickname, centerX, nicknameY);

          // 날짜
          const dateY = nicknameY + 22 + 16;
          ctx.fillStyle = '#9E9C98';
          ctx.font = '16px Pretendard';
          ctx.fillText(date, centerX, dateY);

          // 시간
          const timeY = dateY + 6 + 48;
          const timeParts = practiceTime.match(/(\d+)시간\s*(\d+)분/);
          if (timeParts) {
            const hourNum = timeParts[1];
            const minNum = timeParts[2];
            ctx.font = 'bold 48px Pretendard';
            const hourWidth = ctx.measureText(hourNum).width;
            ctx.font = '300 48px Pretendard';
            const hourUnitWidth = ctx.measureText('시간').width;
            ctx.font = 'bold 48px Pretendard';
            const minWidth = ctx.measureText(minNum).width;
            ctx.font = '300 48px Pretendard';
            const minUnitWidth = ctx.measureText('분').width;
            const totalWidth = hourWidth + hourUnitWidth + minWidth + minUnitWidth;
            let x = centerX - (totalWidth / 2);

            ctx.fillStyle = '#45B5AA';
            ctx.font = 'bold 48px Pretendard';
            ctx.textAlign = 'left';
            ctx.fillText(hourNum, x, timeY);
            x += hourWidth;

            ctx.fillStyle = '#9E9C98';
            ctx.font = '300 48px Pretendard';
            ctx.fillText('시간', x, timeY);
            x += hourUnitWidth;

            ctx.fillStyle = '#45B5AA';
            ctx.font = 'bold 48px Pretendard';
            ctx.fillText(minNum, x, timeY);
            x += minWidth;

            ctx.fillStyle = '#9E9C98';
            ctx.font = '300 48px Pretendard';
            ctx.fillText('분', x, timeY);
          }
          safeResolve(canvas.toDataURL('image/png', 1.0));
        }
      }
    } catch (err) {
      // 예외 발생 시 항상 reject
      reject(err);
    }
  });
};

// 단일 다운로드 함수
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
      const dataUrl = await generateExportImage(nickname, date, practiceTime, avatar);
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
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(45, 45, 42, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 8,
          padding: "40px",
          textAlign: "center",
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
        }}
        onClick={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div>
            <div style={{ fontSize: 18, color: "#2d2d2a", marginBottom: 16 }}>
              최고 화질 이미지 생성 중...
            </div>
            <div style={{ fontSize: 14, color: "#9e9c98" }}>
              잠시만 기다려주세요
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 18, color: "#45b5aa", marginBottom: 16 }}>
              다운로드 완료!
            </div>
            <div style={{ fontSize: 14, color: "#9e9c98" }}>
              최고 화질 피출 기록이 저장되었습니다
            </div>
          </div>
        )}
      </div>
    </div>
  );
}