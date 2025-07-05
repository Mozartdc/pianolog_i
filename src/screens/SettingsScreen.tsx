import React, { useState, useRef } from "react";
import Header from "../components/Header"; // 실제 경로에 맞게 수정해주세요.
import AvatarCropper, { AvatarCropperHandles } from "../components/ProfileUploader";
// 아이콘 import
import ExportIcon from "../assets/icons/s_export.svg";
import ImportIcon from "../assets/icons/s_import.svg";
import DayIcon from "../assets/icons/day.svg";
import NightIcon from "../assets/icons/night.svg";
import SystemIcon from "../assets/icons/system.svg";
import RadioOn from "../assets/icons/radio_on.svg";
import RadioOff from "../assets/icons/radiooff.svg";
import Logo from "../utils/img/logo.png";

const themeOptions = [
  { value: "light", label: "light", icon: DayIcon },
  { value: "dark", label: "dark", icon: NightIcon },
  { value: "system", label: "system", icon: SystemIcon },
];

// CSV 변환 유틸
function toCSV(data: any[]) {
  if (!data.length) return "";
  const keys = Object.keys(data[0]);
  const rows = data.map(row => keys.map(k => row[k]).join(","));
  return [keys.join(","), ...rows].join("\n");
}
function fromCSV(csv: string) {
  const [header, ...lines] = csv.trim().split("\n");
  const keys = header.split(",");
  return lines.map(line => {
    const values = line.split(",");
    const obj: any = {};
    keys.forEach((k, i) => (obj[k] = values[i]));
    return obj;
  });
}

export default function SettingScreen() {
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "디붕이");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  const avatarCropperRef = useRef<AvatarCropperHandles>(null);

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    localStorage.setItem("nickname", e.target.value);
  };

  const handleExport = () => {
    const records = JSON.parse(localStorage.getItem("practiceRecords") || "[]");
    const csv = toCSV(records);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "practiceRecords.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const csv = reader.result as string;
          const data = fromCSV(csv);
          localStorage.setItem("practiceRecords", JSON.stringify(data));
          alert("연습 기록 복원이 완료되었습니다.");
        } catch (error) {
          console.error("Failed to parse CSV:", error);
          alert("CSV 파일 읽기에 실패했습니다. 올바른 형식의 파일인지 확인해주세요.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRegisterAvatarClick = () => {
    avatarCropperRef.current?.triggerFileInput();
  };

  const handleAvatarDelete = () => {
    setAvatar("");
    localStorage.removeItem("avatar");
  };

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      background: "#fff",
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingBottom: 34,
      paddingTop: 44,
    }}>
      <Header title="app setting" />

      {/* 프로필 섹션 */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 32,
        width: "90%",
        maxWidth: 343,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          width: "100%",
          justifyContent: "flex-start",
        }}>
          <AvatarCropper ref={avatarCropperRef} onAvatarChange={setAvatar} size={80} />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleRegisterAvatarClick}
              style={{
                width: 77,
                height: 40,
                background: "#F3D6CB",
                border: "none",
                borderRadius: 8,
                color: "#2D2D2A",
                fontSize: 14,
                fontWeight: "normal",
                lineHeight: "140%",
                cursor: "pointer",
                ...commonFontStyle
              }}
            >
              등록
            </button>
            <button
              onClick={handleAvatarDelete}
              style={{
                width: 77,
                height: 40,
                background: "#F3D6CB",
                border: "none",
                borderRadius: 8,
                color: "#2D2D2A",
                fontSize: 14,
                fontWeight: "normal",
                lineHeight: "140%",
                cursor: "pointer",
                ...commonFontStyle
              }}
            >
              삭제
            </button>
          </div>
        </div>

        <div style={{
          width: "100%",
          textAlign: "center",
          color: "#2D2D2A",
          fontSize: 14,
          marginTop: 26,
          ...commonFontStyle
        }}>
          닉네임 입력
        </div>
        <input
          value={nickname}
          onChange={handleNicknameChange}
          placeholder=""
          style={{
            width: "95%",
            maxWidth: "100%",
            height: 40,
            padding: "8px 16px",
            borderRadius: 8,
            border: "0.5px solid #BB2649",
            background: "#fff",
            fontSize: 16,
            marginTop: 15,
            marginBottom: 16,
            boxSizing: "border-box",
            ...commonFontStyle
          }}
        />
      </div>

      {/* 데이터 관리 구분선 */}
      <div style={{
        width: "90%",
        maxWidth: 327,
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "24px auto 16px auto"
      }}>
        <div style={{ flex: 1, height: 0.5, background: "#BB2649" }} />
        <span style={{
          color: "#2D2D2A",
          fontSize: 14,
          fontWeight: 400,
          lineHeight: "140%",
          ...commonFontStyle
        }}>데이터 관리</span>
        <div style={{ flex: 1, height: 0.5, background: "#BB2649" }} />
      </div>

      {/* 내보내기/가져오기 버튼 */}
      <button
        onClick={handleExport}
        style={{
          width: "90%",
          maxWidth: 327,
          height: 40,
          borderRadius: 8,
          background: "#F3D6CB",
          border: "none",
          color: "#2D2D2A",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "center",
          marginBottom: 8,
          cursor: "pointer",
          ...commonFontStyle
        }}
      >
        <img src={ExportIcon} alt="내보내기" width={16} height={20} />
        연습 기록 내보내기
      </button>
      <label style={{
        width: "90%",
        maxWidth: 327,
        height: 40,
        borderRadius: 8,
        background: "#F3D6CB",
        border: "none",
        color: "#2D2D2A",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        marginBottom: 18,
        cursor: "pointer",
        ...commonFontStyle
      }}>
        <img src={ImportIcon} alt="가져오기" width={16} height={20} />
        연습 기록 가져오기
        <input type="file" accept=".csv" hidden onChange={handleImport} />
      </label>
      <div style={{
        width: "90%",
        maxWidth: 327,
        color: "#9E9C98",
        textAlign: "center",
        fontSize: 12,
        lineHeight: "150%",
        margin: "0 auto 18px auto",
        ...commonFontStyle
      }}>
        기기 변경 시 CSV로 백업/복원 가능합니다.
      </div>

      {/* display 구분선 */}
      <div style={{
        width: "90%",
        maxWidth: 327,
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "0 auto 16px auto"
      }}>
        <div style={{ flex: 1, height: 0.5, background: "#BB2649" }} />
        <span style={{ color: "#2D2D2A", fontSize: 14, ...commonFontStyle }}>display</span>
        <div style={{ flex: 1, height: 0.5, background: "#BB2649" }} />
      </div>

      {/* 테마 선택 라디오 */}
      <div style={{
        display: "flex",
        width: "90%",
        maxWidth: 320,
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
        marginBottom: 32
      }}>
        {themeOptions.map(opt => {
          const checked = theme === opt.value;
          return (
            <label key={opt.value} style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
              userSelect: "none"
            }}>
              <img
                src={checked ? RadioOn : RadioOff}
                alt={opt.label}
                width={20}
                height={20}
                style={{
                  marginRight: 3,
                  filter: checked
                    ? "none"
                    : "invert(60%) sepia(7%) saturate(0%) hue-rotate(0deg) brightness(1.1)",
                }}
              />
              <img
                src={opt.icon}
                alt={opt.label}
                width={16}
                height={16}
                style={{
                  filter: checked
                    ? "invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0.18)"
                    : "invert(60%) sepia(7%) saturate(0%) hue-rotate(0deg) brightness(1.1)",
                }}
              />
              <span style={{
                color: checked ? "#2D2D2A" : "#9E9C98",
                fontSize: 12,
                ...commonFontStyle
              }}>{opt.label}</span>
              <input
                type="radio"
                name="theme"
                value={opt.value}
                checked={checked}
                onChange={() => setTheme(opt.value as any)}
                style={{ display: "none" }}
              />
            </label>
          );
        })}
      </div>

      {/* 로고/앱이름 */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 10
      }}>
        <img
          src={Logo}
          alt="logo"
          width={100}
          height={104}
        />
        <span style={{
          color: "#2D2D2A",
          textAlign: "center",
          fontSize: 14,
          lineHeight: "100%",
          marginTop: 0,
          ...commonFontStyle
        }}>digital piano gallery</span>
      </div>
    </div>
  );
}