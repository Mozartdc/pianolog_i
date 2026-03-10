import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import UploadIcon from '../assets/icons/upload.svg?react';
import UserIcon from '../assets/icons/user.svg?react';

export interface AvatarCropperHandles {
  triggerFileInput: () => void;
}

interface ProfileUploaderProps {
  onAvatarChange: (newAvatar: string) => void;
  size?: number;
  avatar?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ProfileUploader = forwardRef<AvatarCropperHandles, ProfileUploaderProps>(({
  onAvatarChange,
  size = 80,
  avatar
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentAvatar, setCurrentAvatar] = useState(avatar || '');
  const [imageToCrop, setImageToCrop] = useState<string | undefined>(undefined);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // react-easy-crop state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Sync currentAvatar when avatar prop changes
  useEffect(() => {
    console.log('ProfileUploader: avatar prop changed:', avatar);
    setCurrentAvatar(avatar || '');
  }, [avatar]);

  useImperativeHandle(ref, () => ({
    triggerFileInput: () => fileInputRef.current?.click(),
  }));

  // File handling logic
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
        
        // Reset crop state
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
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

  // Crop completion callback
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Image cropping function using Canvas
  const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }

        // Fixed output size to 512x512 (high quality)
        canvas.width = 512;
        canvas.height = 512;

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          512,
          512
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Canvas toBlob 실패'));
          }
        }, 'image/png', 0.9);
      };
      
      image.onerror = () => reject(new Error('이미지 로드 실패'));
      image.src = imageSrc;
    });
  };

  // Handle crop save
  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) {
      alert('크롭 영역을 설정해주세요.');
      return;
    }

    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      onAvatarChange(croppedImage);
      setCropModalOpen(false);
      setImageToCrop(undefined);
    } catch (error) {
      console.error('크롭 실패:', error);
      alert('이미지를 저장할 수 없습니다. 다시 시도해주세요.');
    }
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setCropModalOpen(false);
    setImageToCrop(undefined);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  };

  return (
    <>
      {/* Profile image display area */}
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
          // Show only text in empty state (removed upload icon)
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ 
              fontSize: size * 0.15, 
              color: 'var(--text-secondary)',
              textAlign: 'center',
              ...commonFontStyle
            }}>
              프로필
            </span>
          </div>
        )}
        
        {/* Loading overlay */}
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
              border: '2px solid var(--VIVA_MAGENTA)',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              fontSize: '10px',
              color: 'white',
              marginTop: '8px',
              ...commonFontStyle
            }}>
              로딩 중...
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isLoading}
      />

      {/* Image crop modal - using react-easy-crop */}
      {cropModalOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          background: 'var(--modal-backdrop-home)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '40px 0px',
        }}>
          <div style={{ 
            background: 'var(--bg-primary)', 
            color: 'var(--text-primary)',
            borderRadius: 8,
            width: 'calc(100% - 32px)',
            minHeight: 400,
            maxHeight: '80vh',
            boxShadow: 'var(--shadow-medium)',
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 20px 20px 20px',
            boxSizing: 'border-box',
            position: 'relative',
            border: 'var(--modal-border)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 24,
              marginTop: 4,
              ...commonFontStyle,
            }}>
              <UserIcon width={24} height={24} style={{ color: 'var(--VIVA_MAGENTA)' }} />
              <span style={{ 
                fontSize: 20, 
                fontWeight: 600, 
                color: 'var(--text-primary)' 
              }}>
                프로필 사진 편집
              </span>
            </div>
            
            {/* Crop area */}
            <div style={{ 
              position: 'relative',
              width: '100%',
              height: 300,
              marginBottom: 20,
              borderRadius: 'var(--border-radius-medium)',
              overflow: 'hidden',
              backgroundColor: '#000'
            }}>
              {imageToCrop && (
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1} // Fixed square aspect ratio
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  minZoom={1}
                  maxZoom={3}
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      borderRadius: 'var(--border-radius-medium)',
                    }
                  }}
                />
              )}
            </div>
            
            {/* Instruction text */}
            <div style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: 20,
              lineHeight: '16px',
              ...commonFontStyle
            }}>
              드래그해서 위치를 조정하고,<br />
              두 손가락을 벌리고 좁혀서 확대/축소하세요
            </div>
            
            {/* Button area - same style as HomeStopModal */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              gap: 12, 
              marginTop: 'auto'
            }}>
              {/* Cancel button - left */}
              <button
                onClick={handleCropCancel}
                style={{
                  width: 140, 
                  height: 35,
                  borderRadius: 'var(--border-radius-small)',
                  border: 'none', 
                  background: 'transparent',
                  fontSize: 16, 
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 8, 
                  ...commonFontStyle,
                  color: 'var(--text-primary)',
                }}
              >
                <span style={{ color: 'currentColor' }}>Cancel</span>
              </button>
              
              {/* Upload button - right */}
              <button
                onClick={handleCropSave}
                style={{
                  width: 140, 
                  height: 35,
                  background: 'none', 
                  border: 'none',
                  borderRadius: 'var(--border-radius-small)',
                  cursor: 'pointer',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 8,
                  color: 'var(--VIVA_MAGENTA)', 
                  ...commonFontStyle,
                }}
              >
                <UploadIcon width={16} height={16} style={{ color: 'currentColor' }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Upload</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spinner animation CSS */}
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

ProfileUploader.displayName = 'ProfileUploader';

export default ProfileUploader;