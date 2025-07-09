import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css'; // Cropper CSS import
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
  size = 80 // SettingScreen에서 80으로 사용하므로 기본값을 맞춰줍니다.
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const [currentAvatar, setCurrentAvatar] = useState(() => localStorage.getItem('avatar') || '');
  
  // ✨ 변경점: 모달 및 이미지 소스 상태 추가
  const [imageToCrop, setImageToCrop] = useState<string | undefined>(undefined);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => setCurrentAvatar(localStorage.getItem('avatar') || '');
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useImperativeHandle(ref, () => ({
    triggerFileInput: () => fileInputRef.current?.click(),
  }));

  // ✨ 변경점: 파일 선택 시 모달을 띄우도록 수정
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
      e.target.value = ''; // 같은 파일 다시 선택 가능하도록 초기화
    }
  };

  // ✨ 변경점: 이미지 자르기 및 저장 함수
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
          // ✨ 변경점: 직접 클릭 기능 제거 (cursor: 'pointer' 삭제)
        }}
      >
        {currentAvatar ? (
          <img src={currentAvatar} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Icon name="keyboard" size={size * 0.5} color="#45b5aa" />
        )}
      </div>

      {/* 숨겨진 파일 입력창 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

{/* 이미지 자르기 모달 */}
      {cropModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            background: 'var(--bg-primary)', 
            color: 'var(--text-primary)',
            padding: '20px', 
            borderRadius: '8px', 
            width: '90%', 
            maxWidth: '400px' 
          }}>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--FONT_FAMILY)' }}>프로필 사진 편집</h3>
            <div style={{ height: '300px', width: '100%', marginBottom: '20px' }}>
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
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setCropModalOpen(false)} 
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '4px', 
                    border: '1px solid var(--border-light)', 
                    background: 'transparent',
                    color: 'var(--text-primary)', 
                    cursor: 'pointer' 
                  }}>
                  취소
                </button>
                <button 
                  onClick={handleCrop} 
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '4px', 
                    border: 'none', 
                    background: 'var(--VIVA_MAGENTA)', 
                    color: 'var(--button-primary-text)', 
                    cursor: 'pointer' 
                  }}>
                  저장
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default ProfileUploader;