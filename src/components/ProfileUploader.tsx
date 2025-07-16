import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import Icon from './Icon';

export interface AvatarCropperHandles {
  triggerFileInput: () => void;
}

interface ProfileUploaderProps {
  onAvatarChange: (newAvatar: string) => void;
  size?: number;
}

const ProfileUploader = forwardRef<AvatarCropperHandles, ProfileUploaderProps>(({
  onAvatarChange,
  size = 80
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const [currentAvatar, setCurrentAvatar] = useState(() => localStorage.getItem('avatar') || '');
  const [imageToCrop, setImageToCrop] = useState<string | undefined>(undefined);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  // ✨ 추가: 로딩 상태 관리
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => setCurrentAvatar(localStorage.getItem('avatar') || '');
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useImperativeHandle(ref, () => ({
    triggerFileInput: () => fileInputRef.current?.click(),
  }));

  // ✨ 개선된 파일 처리 로직
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // 파일 크기 체크
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      // 로딩 시작
      setIsLoading(true);
      
      const reader = new FileReader();
      let timeoutId: number;
      
      // 타임아웃 설정 (10초)
      timeoutId = window.setTimeout(() => {
        setIsLoading(false);
        alert('사진 로딩 시간이 초과되었습니다.\n최근 사진이나 기기에 저장된 사진을 선택해주세요.');
      }, 10000);
      
      reader.addEventListener('load', () => {
        clearTimeout(timeoutId);
        setIsLoading(false);
        setImageToCrop(reader.result as string);
        setCropModalOpen(true);
      });
      
      reader.addEventListener('error', () => {
        clearTimeout(timeoutId);
        setIsLoading(false);
        alert('사진을 불러올 수 없습니다.\n다른 사진을 선택해주세요.');
      });
      
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleCrop = () => {
    if (cropperRef.current) {
      const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas();
      const croppedImage = croppedCanvas.toDataURL('image/png');

      localStorage.setItem('avatar', croppedImage);
      setCurrentAvatar(croppedImage);
      onAvatarChange(croppedImage);
      setCropModalOpen(false);
      setImageToCrop(undefined);
    }
  };

  return (
    <>
      {/* 프로필 이미지 표시 영역 */}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: 'var(--border-radius-large)',
          backgroundColor: 'var(--info-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: 'none',
          position: 'relative' // 로딩 오버레이를 위한 position 추가
        }}
      >
        {currentAvatar ? (
          <img src={currentAvatar} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Icon name="keyboard" size={size * 0.5} color="#45b5aa" />
        )}
        
        {/* ✨ 로딩 오버레이 */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--border-radius-large)'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid var(--TURQUOISE)',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              fontSize: '10px',
              color: 'white',
              marginTop: '8px',
              fontFamily: 'var(--FONT_FAMILY)'
            }}>
              로딩 중...
            </div>
          </div>
        )}
      </div>

      {/* 숨겨진 파일 입력창 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isLoading} // 로딩 중일 때 비활성화
      />

      {/* 이미지 자르기 모달 */}
      {cropModalOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          background: 'rgba(0,0,0,0.7)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div style={{ 
            background: 'var(--bg-primary)', 
            color: 'var(--text-primary)',
            padding: '20px', 
            borderRadius: '8px', 
            width: '90%', 
            maxWidth: '400px' 
          }}>
            <h3 style={{ 
              marginTop: 0, 
              fontFamily: 'var(--FONT_FAMILY)',
              fontSize: '18px',
              marginBottom: '16px'
            }}>
              프로필 사진 편집
            </h3>
            <div style={{ 
              height: '300px', 
              width: '100%', 
              marginBottom: '20px' 
            }}>
              <Cropper
                ref={cropperRef}
                src={imageToCrop}
                style={{ height: '100%', width: '100%' }}
                aspectRatio={1}
                guides={false}
                viewMode={1}
                dragMode='move'
                background={false}
                responsive={true}
                checkOrientation={false}
              />
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'flex-end' 
            }}>
              <button 
                onClick={() => {
                  setCropModalOpen(false);
                  setImageToCrop(undefined);
                }}
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-light)', 
                  background: 'transparent',
                  color: 'var(--text-primary)', 
                  cursor: 'pointer',
                  fontFamily: 'var(--FONT_FAMILY)',
                  fontSize: '14px'
                }}>
                취소
              </button>
              <button 
                onClick={handleCrop} 
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: 'var(--TURQUOISE)', 
                  color: 'var(--button-primary-text)', 
                  cursor: 'pointer',
                  fontFamily: 'var(--FONT_FAMILY)',
                  fontSize: '14px'
                }}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ 로딩 스피너 애니메이션 CSS */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
});

export default ProfileUploader;