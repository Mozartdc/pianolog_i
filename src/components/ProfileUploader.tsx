import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
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
  const imgRef = useRef<HTMLImageElement>(null);

  const [currentAvatar, setCurrentAvatar] = useState(() => localStorage.getItem('avatar') || '');
  const [imageToCrop, setImageToCrop] = useState<string | undefined>(undefined);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // react-image-crop 상태
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  useEffect(() => {
    const handleStorageChange = () => setCurrentAvatar(localStorage.getItem('avatar') || '');
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useImperativeHandle(ref, () => ({
    triggerFileInput: () => fileInputRef.current?.click(),
  }));

  // 파일 처리 로직 (기존과 동일)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      setIsLoading(true);
      
      const reader = new FileReader();
      let timeoutId: number;
      
      timeoutId = window.setTimeout(() => {
        setIsLoading(false);
        alert('사진 로딩 시간이 초과되었습니다.\n최근 사진이나 기기에 저장된 사진을 선택해주세요.');
      }, 10000);
      
      reader.addEventListener('load', () => {
        clearTimeout(timeoutId);
        setIsLoading(false);
        setImageToCrop(reader.result as string);
        setCropModalOpen(true);
        
        // 크롭 영역 초기화 (중앙 정사각형)
        setCrop({
          unit: '%',
          width: 80,
          height: 80,
          x: 10,
          y: 10
        });
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

  // 이미지 로드 완료 시 크롭 영역 조정
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // 정사각형 크롭 영역을 이미지 중앙에 설정
    const size = Math.min(width, height);
    const cropSize = size * 0.8; // 이미지의 80% 크기
    
    setCrop({
      unit: 'px',
      width: cropSize,
      height: cropSize,
      x: (width - cropSize) / 2,
      y: (height - cropSize) / 2
    });
  };

  // 크롭 완료 처리
  const handleCrop = () => {
    if (!imgRef.current || !completedCrop) {
      alert('크롭 영역을 설정해주세요.');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        alert('캔버스를 생성할 수 없습니다.');
        return;
      }

      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // 출력 크기를 512x512로 고정 (고품질)
      canvas.width = 512;
      canvas.height = 512;

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        512,
        512
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const croppedImage = reader.result as string;
            
            localStorage.setItem('avatar', croppedImage);
            setCurrentAvatar(croppedImage);
            onAvatarChange(croppedImage);
            setCropModalOpen(false);
            setImageToCrop(undefined);
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/png', 0.9);

    } catch (error) {
      console.error('크롭 실패:', error);
      alert('이미지를 저장할 수 없습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      {/* 프로필 이미지 표시 영역 (기존과 동일) */}
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
          position: 'relative'
        }}
      >
        {currentAvatar ? (
          <img src={currentAvatar} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Icon name="keyboard" size={size * 0.5} color="#45b5aa" />
        )}
        
        {/* 로딩 오버레이 (기존과 동일) */}
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

      {/* 숨겨진 파일 입력창 (기존과 동일) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isLoading}
      />

      {/* 이미지 크롭 모달 - react-image-crop 사용 */}
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
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            background: 'var(--bg-primary)', 
            color: 'var(--text-primary)',
            padding: '20px', 
            borderRadius: '12px', 
            width: '100%', 
            maxWidth: '400px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ 
              marginTop: 0, 
              fontFamily: 'var(--FONT_FAMILY)',
              fontSize: '18px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              프로필 사진 편집
            </h3>
            
            <div style={{ 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {imageToCrop && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1} // 정사각형 비율 고정
                  minWidth={50}
                  minHeight={50}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px'
                  }}
                >
                  <img
                    ref={imgRef}
                    src={imageToCrop}
                    alt="크롭할 이미지"
                    onLoad={onImageLoad}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain'
                    }}
                  />
                </ReactCrop>
              )}
            </div>
            
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: '20px',
              fontFamily: 'var(--FONT_FAMILY)'
            }}>
              드래그해서 크기와 위치를 조정하세요
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

      {/* 로딩 스피너 애니메이션 CSS (기존과 동일) */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* react-image-crop 커스텀 스타일 */
          .ReactCrop__crop-selection {
            border: 2px solid var(--TURQUOISE) !important;
          }
          
          .ReactCrop__drag-handle {
            background-color: var(--TURQUOISE) !important;
            border: 1px solid white !important;
          }
        `}
      </style>
    </>
  );
});

export default ProfileUploader;