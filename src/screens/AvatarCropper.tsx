import React, { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";

interface AvatarCropperProps {
  avatar: string;
  onAvatarChange: (img: string) => void;
  size?: number;
}

const AvatarCropper: React.FC<AvatarCropperProps> = ({
  avatar,
  onAvatarChange,
  size = 80,
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 사용
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropSave = async () => {
    if (!image || !croppedAreaPixels) return;
    try {
      const croppedImg = await getCroppedImg(image, croppedAreaPixels);
      localStorage.setItem("avatar", croppedImg);
      onAvatarChange(croppedImg);
      setShowCropper(false);
      setImage(null);
    } catch (e) {
      console.error("Failed to crop the image:", e);
      alert("이미지 크롭에 실패했습니다.");
    }
  };

  const handleDelete = () => {
    localStorage.removeItem("avatar");
    onAvatarChange("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      {/* 프로필 이미지 박스 */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 24,
          background: avatar ? "transparent" : "var(--button-secondary-bg)", // ✅ 수정
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxSizing: "border-box",
        }}
        onClick={() => !avatar && fileRef.current?.click()}
      >
        {avatar ? (
          <img
            src={avatar}
            alt="avatar"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span
            style={{
              color: "var(--text-primary)", // ✅ 수정
              fontSize: 14,
              ...commonFontStyle,
            }}
          >
            사진 등록
          </span>
        )}
      </div>

      {/* 등록/삭제 버튼 */}
      <div style={{ display: "flex", gap: 14 }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: 77,
            height: 40,
            background: "var(--button-secondary-bg)", // ✅ 수정
            border: "none",
            borderRadius: 8,
            color: "var(--text-primary)", // ✅ 수정
            fontSize: 14,
            cursor: "pointer",
            ...commonFontStyle,
          }}
        >
          {avatar ? "변경" : "등록"}
        </button>
        {avatar && (
          <button
            onClick={handleDelete}
            style={{
              width: 77,
              height: 40,
              background: "var(--button-secondary-bg)", // ✅ 수정
              border: "none",
              borderRadius: 8,
              color: "var(--text-primary)", // ✅ 수정
              fontSize: 14,
              cursor: "pointer",
              ...commonFontStyle,
            }}
          >
            삭제
          </button>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* 크롭 모달 */}
      {showCropper && image && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 320,
              height: 420,
              background: "var(--bg-primary)", // ✅ 수정
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: 280,
                height: 280,
                position: "relative",
                marginBottom: 20,
                borderRadius: 24,
                overflow: "hidden",
              }}
            >
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowCropper(false)}
                style={{
                  background: "var(--button-secondary-bg)", // ✅ 수정
                  color: "var(--error-color)", // ✅ 수정
                  border: "none",
                  borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer", ...commonFontStyle
                }}
              >
                취소
              </button>
              <button
                onClick={handleCropSave}
                style={{
                  background: "var(--error-color)", // ✅ 수정
                  color: "var(--button-primary-text)", // ✅ 수정
                  border: "none",
                  borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer", ...commonFontStyle
                }}
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarCropper;