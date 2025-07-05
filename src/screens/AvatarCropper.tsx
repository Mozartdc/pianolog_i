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
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
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
    // 동일한 파일 재업로드를 위해 value 초기화
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

  // --- 수정된 부분: 사진 삭제 핸들러 ---
  // 버튼에서 직접 호출하도록 변경합니다.
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
        gap: 14, // 아바타와 버튼 간의 간격
      }}
    >
      {/* 프로필 이미지 박스 */}
      <div
        style={{
          width: size,
          height: size,
          // --- 수정된 부분: PDF 가이드에 따른 border-radius 값(24px) 적용 ---
          borderRadius: 24,
          // --- 수정된 부분: 아바타가 없을 때 배경색(#F3D6CB)이 보이도록 수정 ---
          // 기존 코드에도 있었으나, 명확성을 위해 주석 추가
          background: avatar ? "transparent" : "#F3D6CB",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxSizing: "border-box",
        }}
        // 사진 등록 버튼의 역할을 하도록 클릭 이벤트 추가
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
          // --- 수정된 부분: 플레이스홀더 텍스트 스타일 ---
          // 배경색이 보이도록 텍스트만 표시
          <span
            style={{
              color: "#2D2D2A", // Jet Black
              fontSize: 14,
              ...commonFontStyle,
            }}
          >
            사진 등록
          </span>
        )}
      </div>

      {/* --- 수정된 부분: PDF 가이드에 따른 등록/삭제 버튼 --- */}
      <div style={{ display: "flex", gap: 14 }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: 77,
            height: 40,
            background: "#F3D6CB", // Pearl Blush
            border: "none",
            borderRadius: 8,
            color: "#2D2D2A", // Jet Black
            fontSize: 14,
            cursor: "pointer",
            ...commonFontStyle,
          }}
        >
          {avatar ? "변경" : "등록"}
        </button>
        {/* avatar가 있을 때만 삭제 버튼 표시 */}
        {avatar && (
          <button
            onClick={handleDelete}
            style={{
              width: 77,
              height: 40,
              background: "#F3D6CB", // Pearl Blush
              border: "none",
              borderRadius: 8,
              color: "#2D2D2A", // Jet Black
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
              height: 420, // 버튼 공간 확보
              background: "#fff",
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
                // --- 수정된 부분: 크롭 영역에 둥근 모서리(24px)를 시각적으로 표시 ---
                borderRadius: 24,
                overflow: "hidden", // borderRadius를 적용하기 위해 추가
              }}
            >
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                // --- 수정된 부분: 원형(round)에서 사각형(rect)으로 변경 ---
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
                  background: "#F3D6CB", color: "#BB2649", border: "none",
                  borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer", ...commonFontStyle
                }}
              >
                취소
              </button>
              <button
                onClick={handleCropSave}
                style={{
                  background: "#BB2649", color: "#fff", border: "none",
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

