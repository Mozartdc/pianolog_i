import React, { useRef, useState } from 'react';
import Icon from './Icon';

interface ProfileUploaderProps {
  currentAvatar: string;
  onAvatarChange: (newAvatar: string) => void;
  size?: number;
}

const ProfileUploader: React.FC<ProfileUploaderProps> = ({ 
  currentAvatar, 
  onAvatarChange, 
  size = 60 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    <div style={{ position: 'relative' }}>
      {/* 프로필 이미지 */}
      <div
        onClick={handleImageClick}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: 'var(--PASTEL_TURQUOISE)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '2px solid var(--TURQUOISE)',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        {isUploading ? (
          <div style={{ 
            fontSize: `${size * 0.3}px`,
            animation: 'spin 1s linear infinite'
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
          <Icon name="keyboard" size={size * 0.5} color="var(--TURQUOISE)" />
        )}
      </div>

      {/* 편집 아이콘 */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: `${size * 0.3}px`,
          height: `${size * 0.3}px`,
          backgroundColor: 'var(--TURQUOISE)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '2px solid var(--WHITE)'
        }}
        onClick={handleImageClick}
      >
        <span style={{ 
          color: 'var(--WHITE)', 
          fontSize: `${size * 0.15}px`,
          fontWeight: 'bold'
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

export default ProfileUploader;
