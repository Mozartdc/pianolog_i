import React, { useRef, useState } from 'react';
import Icon from './Icon';

interface ProfileUploaderProps {
  currentAvatar: string;
  onAvatarChange: (newAvatar: string) => void;
  size?: number;
  responsive?: boolean; // ✅ 반응형 옵션 추가
}

const ProfileUploader: React.FC<ProfileUploaderProps> = ({ 
  currentAvatar, 
  onAvatarChange, 
  size = 60,
  responsive = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ 반응형 크기 계산
  const getResponsiveSize = () => {
    if (!responsive) return `${size}px`;
    
    // 화면 크기에 따른 동적 크기
    const minSize = Math.max(size * 0.8, 40); // 최소 40px
    const maxSize = size * 1.2; // 최대 120%
    return `clamp(${minSize}px, ${size / 375 * 100}vw, ${maxSize}px)`;
  };

  const containerSize = getResponsiveSize();

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);

    // FileReader로 이미지를 Base64로 변환하여 localStorage에 저장
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // localStorage에 저장
        localStorage.setItem('avatar', result);
        // 상태 업데이트
        onAvatarChange(result);
      }
      setIsUploading(false);
    };

    reader.onerror = () => {
      alert('이미지 업로드 중 오류가 발생했습니다.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={{ 
      position: 'relative',
      fontFamily: 'var(--FONT_FAMILY)' // ✅ 폰트 통일
    }}>
      {/* 프로필 이미지 */}
      <div
        onClick={handleImageClick}
        style={{
          width: containerSize, // ✅ 반응형 크기 적용
          height: containerSize, // ✅ 반응형 크기 적용
          borderRadius: '50%',
          backgroundColor: 'var(--PASTEL_TURQUOISE)', // ✅ CSS 변수 적용
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          border: `2px solid var(--TURQUOISE)`, // ✅ CSS 변수 적용
          transition: 'var(--transition-fast)', // ✅ CSS 변수 적용
          position: 'relative',
          boxSizing: 'border-box' // ✅ 박스 사이징 명시
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.transform = 'scale(1.02)'; // ✅ 부드러운 호버 효과
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        // ✅ 접근성 개선
        role="button"
        tabIndex={0}
        aria-label="프로필 이미지 변경"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleImageClick();
          }
        }}
      >
        {isUploading ? (
          <div style={{ 
            fontSize: responsive ? 'clamp(12px, 4vw, 20px)' : `${size * 0.3}px`, // ✅ 반응형 폰트
            animation: 'spin 1s linear infinite',
            color: 'var(--TURQUOISE)' // ✅ CSS 변수 적용
          }}>
            ⏳
          </div>
        ) : currentAvatar ? (
          <img 
            src={currentAvatar} 
            alt="프로필" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }} 
          />
        ) : (
          <Icon 
            name="keyboard" 
            size={responsive ? size * 0.5 : size * 0.5} 
            color="var(--TURQUOISE)" // ✅ CSS 변수 적용
            responsive={responsive} // ✅ 반응형 아이콘
          />
        )}
      </div>

      {/* 편집 아이콘 */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: responsive 
            ? `clamp(${size * 0.25}px, ${size * 0.3 / 375 * 100}vw, ${size * 0.35}px)` 
            : `${size * 0.3}px`, // ✅ 반응형 크기
          height: responsive 
            ? `clamp(${size * 0.25}px, ${size * 0.3 / 375 * 100}vw, ${size * 0.35}px)` 
            : `${size * 0.3}px`, // ✅ 반응형 크기
          backgroundColor: 'var(--TURQUOISE)', // ✅ CSS 변수 적용
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: `2px solid var(--WHITE)`, // ✅ CSS 변수 적용
          transition: 'var(--transition-fast)', // ✅ CSS 변수 적용
          boxSizing: 'border-box' // ✅ 박스 사이징 명시
        }}
        onClick={handleImageClick}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--VERY_PERI)'; // ✅ 호버 색상 변경
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--TURQUOISE)';
        }}
        // ✅ 접근성 개선
        role="button"
        tabIndex={0}
        aria-label="이미지 편집"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleImageClick();
          }
        }}
      >
        <span style={{ 
          color: 'var(--WHITE)', // ✅ CSS 변수 적용
          fontSize: responsive 
            ? `clamp(${size * 0.12}px, ${size * 0.15 / 375 * 100}vw, ${size * 0.18}px)` 
            : `${size * 0.15}px`, // ✅ 반응형 폰트
          fontWeight: 'bold',
          fontFamily: 'var(--FONT_FAMILY)' // ✅ 폰트 통일
        }}>
          ✏️
        </span>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="프로필 이미지 파일 선택"
      />

      {/* 회전 애니메이션 CSS */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// ✅ 편의 컴포넌트
export const ResponsiveProfileUploader: React.FC<Omit<ProfileUploaderProps, 'responsive'>> = (props) => (
  <ProfileUploader {...props} responsive={true} />
);

export default ProfileUploader;
