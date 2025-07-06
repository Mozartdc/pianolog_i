import React, { useState, useEffect, useRef } from "react";
import StarIcon from "../assets/icons/star.svg";
import LogoImg from "../utils/img/logo.png"; // 이 경로가 올바른지 확인해주세요.

interface ExportCardModalProps {
  isOpen: boolean;
  nickname: string; // HomeScreen에서 받아온 닉네임
  date: string;
  practiceTime: string;
  avatar?: string; // HomeScreen에서 받아온 아바타
  onClose: () => void;
}

export const generateExportImage = async (
  nickname: string, // 이 값을 사용합니다.
  date: string,
  practiceTime: string,
  avatar?: string // 이 값을 사용합니다.
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

        if (avatar) { // 프롭으로 받은 avatar 값을 사용
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
          // 닉네임 (프롭으로 받은 nickname 값을 사용)
          const nicknameY = avatarBottom + 24;
          ctx.fillStyle = '#2D2D2A';
          ctx.font = 'bold 24px Pretendard';
          ctx.textAlign = 'center';
          ctx.fillText(nickname, centerX, nicknameY); // <-- 프롭 nickname 사용

          // 날짜
          const dateY = nicknameY + 22 + 16;
          ctx.fillStyle = '#9E9C98';
          ctx.font = '16px Pretendard';
          ctx.fillText(date, centerX, dateY);

          const timeY = dateY + 6 + 48; // 시간 텍스트의 Y 위치

          // 정규식을 사용하여 '시간'과 '분' 부분을 분리
          const hourMatch = practiceTime.match(/(\d+)시간/);
          const minuteMatch = practiceTime.match(/(\d+)분/);

          let hourNum = hourMatch ? hourMatch[1] : null;
          let minNum = minuteMatch ? minuteMatch[1] : null;

          let totalWidth = 0;
          let currentX = 0;

          // 각 부분의 너비를 미리 계산
          const tempFontBold = 'bold 48px Pretendard';
          const tempFontLight = '300 48px Pretendard';

          // 총 너비 계산
          if (hourNum !== null) {
            ctx.font = tempFontBold;
            totalWidth += ctx.measureText(hourNum).width;
            ctx.font = tempFontLight;
            totalWidth += ctx.measureText('시간').width;
          }
          if (minNum !== null) {
            if (hourNum !== null) totalWidth += 5; // '시간'과 '분' 사이에 약간의 간격 추가
            ctx.font = tempFontBold;
            totalWidth += ctx.measureText(minNum).width;
            ctx.font = tempFontLight;
            totalWidth += ctx.measureText('분').width;
          } else if (hourNum === null && minNum === null) {
              // 아무것도 매칭되지 않는 경우, 기본값 또는 오류 처리
              safeResolve(canvas.toDataURL('image/png', 1.0));
              return;
          }

          currentX = centerX - (totalWidth / 2); // 중앙 정렬 시작점

          ctx.textAlign = 'left'; // 텍스트를 왼쪽에서부터 그리기 시작

          // '시간' 부분 그리기
          if (hourNum !== null) {
            ctx.fillStyle = '#45B5AA';
            ctx.font = tempFontBold;
            ctx.fillText(hourNum, currentX, timeY);
            currentX += ctx.measureText(hourNum).width;

            ctx.fillStyle = '#9E9C98';
            ctx.font = tempFontLight;
            ctx.fillText('시간', currentX, timeY);
            currentX += ctx.measureText('시간').width;
          }

          // '분' 부분 그리기
          if (minNum !== null) {
            if (hourNum !== null) currentX += 5; // '시간'과 '분' 사이에 간격 추가
            ctx.fillStyle = '#45B5AA';
            ctx.font = tempFontBold;
            ctx.fillText(minNum, currentX, timeY);
            currentX += ctx.measureText(minNum).width;

            ctx.fillStyle = '#9E9C98';
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
  nickname, // HomeScreen에서 전달받은 nickname 프롭
  date, 
  practiceTime, 
  avatar, // HomeScreen에서 전달받은 avatar 프롭
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
      // generateExportImage 호출 시, 함수에 전달받은 nickname과 avatar 프롭을 그대로 사용
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