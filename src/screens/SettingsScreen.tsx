import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

// dayjs 플러그인 확장 (반드시 이 코드가 dayjs를 사용하는 컴포넌트 상단에 있어야 합니다)
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import Header from "../components/Header";
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

// PracticeRecord 타입 정의
interface PracticeRecord {
  id: string; // 이 필드는 내부적으로 사용되지만 CSV에서는 내보내지 않을 것임
  date: string;
  practiceTime: number; // 분 단위
  startTime: number;    // 타임스탬프 (밀리초)
  endTime: number;      // 타임스탬프 (밀리초)
  memo?: string;
  track?: string; // 타이머 기록에 연결된 곡명 (CSV에서 내보내지 않을 것임)
}

// Track 타입 정의 (Today.tsx와 일관성)
type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

// PracticeChecks 타입 정의 (Today.tsx와 일관성)
type PracticeChecks = {
  [date: string]: {
    [trackId: number]: boolean;
  };
};

// 개선된 toCSV 함수 정의 - 모든 관련 데이터를 받아서 CSV를 생성
// CSV 파일은 이제 메인 세션 기록에 '해당일_곡_목록' 필드를 포함합니다.
function toCSV(
  practiceRecords: PracticeRecord[],
  allTracks: Track[],
  practiceChecks: PracticeChecks
): string {
  let csvContent = "";

  // ====== 1. 연습 세션 기록 섹션 ======
  const sessionHeaders = [
    "날짜",
    "요일",
    "연습시간",
    "시작시간",
    "종료시간",
    "메모",
    "해당일_곡_목록" // <-- 새로 추가되는 필드
  ];

  const sessionRows = practiceRecords.map(record => {
    const recordDate = dayjs(record.date);
    const dateStr = record.date; //YYYY-MM-DD
    const dayOfWeek = recordDate.format("ddd"); 

    const startTimeFormatted = record.startTime ? dayjs(record.startTime).format("HH:mm:ss") : "";
    const endTimeFormatted = record.endTime ? dayjs(record.endTime).format("HH:mm:ss") : "";

    const totalMinutes = record.practiceTime || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let practiceTimeHumanReadable = "";
    if (hours > 0 && minutes > 0) {
      practiceTimeHumanReadable = `${hours}시간 ${minutes}분`;
    } else if (hours > 0) {
      practiceTimeHumanReadable = `${hours}시간`;
    } else if (minutes > 0) {
      practiceTimeHumanReadable = `${minutes}분`;
    } else {
      practiceTimeHumanReadable = "0분";
    }

    // --- 해당일_곡_목록 생성 로직 ---
    const tracksForThisDate: string[] = [];
    // 해당 날짜에 유효했던 곡만 필터링 (addedDate <= dateStr 이고 completedDate 없거나 dateStr <= completedDate)
    const validTracksForDate = allTracks.filter(track => {
      return dayjs(track.addedDate).isSameOrBefore(dateStr, 'day') &&
             (!track.completedDate || dayjs(track.completedDate).isSameOrAfter(dateStr, 'day'));
    });

    validTracksForDate.forEach(track => {
      const isChecked = practiceChecks[dateStr] && practiceChecks[dateStr][track.id] ? "O" : "X";
      tracksForThisDate.push(`${track.title} (${isChecked})`);
    });
    const tracksListFormatted = tracksForThisDate.length > 0 ? tracksForThisDate.join(", ") : "해당 없음"; // 목록이 비어있을 경우 처리

    return [
      // record.id, // <-- 세션ID 필드 삭제
      record.date,
      dayOfWeek,
      practiceTimeHumanReadable,
      startTimeFormatted,
      endTimeFormatted,
      record.memo || "",
      // record.track || "", // <-- 타이머_연결곡명 필드 삭제
      tracksListFormatted // <-- 새로 추가된 필드 데이터
    ]
    .map(value => {
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        // CSV 이스케이프: 쉼표, 따옴표, 줄바꿈 포함 시 큰따옴표로 감싸고 내부 따옴표는 두 개로
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
    .join(",");
  });

  csvContent += "=== 연습 세션 기록 ===\n"; // 섹션 구분자 (원한다면 제거 가능)
  csvContent += sessionHeaders.join(",") + "\n";
  csvContent += sessionRows.join("\n"); // 줄바꿈 추가

  return csvContent;
}

// fromCSV 함수 (복원 기능은 이 새로운 CSV 포맷에 맞게 대대적인 수정 필요)
// 현재 이 fromCSV는 이전 단일 포맷 CSV만 처리할 수 있습니다.
// 복원 기능을 제대로 구현하려면 이 함수를 이 새로운 CSV 포맷에 맞춰 완전히 재작성해야 합니다.
// 복잡도가 높으므로, 여기서는 기본 형태만 유지하고 복원이 완벽히 작동하지 않을 수 있음을 알립니다.
function fromCSV(csv: string): PracticeRecord[] {
  const lines = csv.trim().split("\n");
  if (lines.length === 0) return [];

  // CSV가 여러 섹션으로 나뉘어 있으므로, 복원은 매우 복잡해집니다.
  // 여기서는 첫 번째 섹션(세션 기록)만 파싱한다고 가정합니다.
  // 실제 복원 로직은 CSV 파일의 구조에 따라 대대적으로 수정되어야 합니다.
  
  const sessionSectionStartIndex = lines.findIndex(line => line.startsWith("=== 연습 세션 기록 ==="));
  if (sessionSectionStartIndex === -1) {
    console.warn("CSV 파일에서 '=== 연습 세션 기록 ===' 섹션을 찾을 수 없습니다. 복원 실패.");
    return [];
  }

  const sessionHeaderLine = lines[sessionSectionStartIndex + 1];
  const sessionDataLines = [];
  for (let i = sessionSectionStartIndex + 2; i < lines.length; i++) {
    // 이제는 파일 끝까지 혹은 명확한 다른 섹션 시작 전까지 데이터로 간주
    if (lines[i].startsWith("===") || lines[i].trim() === "") { // 다음 섹션이 시작되거나 빈 줄이 나오면 중단
      break; 
    }
    sessionDataLines.push(lines[i]);
  }

  if (!sessionHeaderLine || sessionDataLines.length === 0) return [];

  const keys = sessionHeaderLine.split(",");
  // fromCSV는 이제 CSV에 없는 '세션ID'와 '타이머_연결곡명' 필드를 복원하지 않습니다.
  // '해당일_곡_목록' 필드도 복원하지 않습니다 (계산된 값이므로 practiceRecords에 직접 저장되지 않음).
  const headerMap: { [key: string]: keyof PracticeRecord } = {
    // "세션ID": "id", // CSV 헤더에서 제거됨
    "날짜": "date",
    "요일": "date", 
    "연습시간": "practiceTime",
    "시작시간": "startTime",
    "종료시간": "endTime",
    "메모": "memo",
    // "타이머_연결곡명": "track", // CSV 헤더에서 제거됨
    // "해당일_곡_목록"은 복원 필드에 포함하지 않음
  };

  return sessionDataLines.map(line => {
    const values = line.split(",");
    const obj: Partial<PracticeRecord> = {};
    
    // CSV 헤더에서 제거된 필드들의 인덱스를 고려하여 values에서 올바른 값을 매핑
    // keys 배열에 있는 헤더의 순서와 values 배열의 순서가 일치해야 합니다.
    // 따라서, keys를 순회하며 매핑하는 방식은 유지하되, 제거된 필드를 건너뛰도록 합니다.
    let valueIndex = 0; // values 배열의 현재 인덱스
    keys.forEach((key, keyIndex) => {
      const fieldName = headerMap[key.trim()];
      
      // '세션ID', '타이머_연결곡명', '해당일_곡_목록'은 fromCSV에서 복원하지 않음.
      // 이 필드들은 headerMap에 없거나, 특별히 처리되지 않습니다.
      if (key.trim() === "세션ID" || key.trim() === "타이머_연결곡명" || key.trim() === "해당일_곡_목록") {
          valueIndex++; // 해당 값을 건너뛰고 다음 값으로 이동
          return;
      }

      if (fieldName) {
        let parsedValue: any = values[valueIndex];
        if (parsedValue && parsedValue.startsWith('"') && parsedValue.endsWith('"')) {
            parsedValue = parsedValue.substring(1, parsedValue.length - 1).replace(/""/g, '"');
        }

        if (fieldName === "practiceTime") {
          const timeString = parsedValue;
          const hourMatch = timeString.match(/(\d+)시간/);
          const minMatch = timeString.match(/(\d+)분/);
          let totalMinutes = 0;
          if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
          if (minMatch) totalMinutes += parseInt(minMatch[1]);
          obj[fieldName] = totalMinutes;
        } else if (fieldName === "startTime" || fieldName === "endTime") {
          const datePart = obj.date || dayjs().format("YYYY-MM-DD");
          const dateTimeString = `${datePart}T${parsedValue}`;
          obj[fieldName] = dayjs(dateTimeString).valueOf();
        } else {
          obj[fieldName] = parsedValue;
        }
      }
      valueIndex++; // 다음 값으로 이동
    });

    // CSV에서 ID 필드를 내보내지 않으므로, 복원 시 새 ID를 할당합니다.
    obj.id = dayjs().valueOf().toString() + Math.random().toString(36).substring(2, 8);
    // track 필드도 CSV에 내보내지 않았으므로 복원 시 기본값으로 설정하거나 비워둡니다.
    obj.track = ""; 

    return obj as PracticeRecord;
  });
}


export default function SettingScreen() {
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "디붕이");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  const avatarCropperRef = useRef<AvatarCropperHandles>(null);

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard, sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  // localStorage 변경 감지 (다른 탭/컴포넌트에서 변경 시)
  useEffect(() => {
    const handleStorageChange = () => {
      setNickname(localStorage.getItem("nickname") || "디붕이");
      setAvatar(localStorage.getItem("avatar") || "");
      // 테마도 localStorage에서 불러와서 설정 (필요하다면)
      // setTheme(localStorage.getItem("theme") as "light" | "dark" | "system" || "light");
    };

    window.addEventListener('storage', handleStorageChange);

    // 같은 탭 내에서 변경 감지 (폴링 방식)
    const interval = setInterval(() => {
      const currentNickname = localStorage.getItem("nickname") || "디붕이";
      const currentAvatar = localStorage.getItem("avatar") || "";
      if (currentNickname !== nickname) {
        setNickname(currentNickname);
      }
      if (currentAvatar !== avatar) {
        setAvatar(currentAvatar);
      }
      // 현재 테마 상태와 localStorage의 테마가 다르면 업데이트
      // const currentTheme = localStorage.getItem("theme") as "light" | "dark" | "system" || "light";
      // if (currentTheme !== theme) {
      //   setTheme(currentTheme);
      // }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [nickname, avatar, theme]); // theme도 의존성 배열에 추가

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    localStorage.setItem("nickname", e.target.value);
  };

  const handleExport = () => {
    try {
      const practiceRecordsString = localStorage.getItem("practiceRecords");
      const records: PracticeRecord[] = practiceRecordsString ? JSON.parse(practiceRecordsString) : [];

      const tracksString = localStorage.getItem("tracks");
      const allTracks: Track[] = tracksString ? JSON.parse(tracksString) : [];

      const practiceChecksString = localStorage.getItem("practiceChecks");
      const checks: PracticeChecks = practiceChecksString ? JSON.parse(practiceChecksString) : {};

      // toCSV 함수에 모든 필요한 데이터를 전달
      const csvContent = toCSV(records, allTracks, checks); 
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" }); // charset 명시
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `피출_연습기록_${dayjs().format("YYYYMMDD_HHmmss")}.csv`; // 파일명 개선
      a.click();
      URL.revokeObjectURL(url); // 메모리 해제
      alert("연습 기록 CSV 파일이 성공적으로 내보내졌습니다!");
    } catch (error) {
      console.error("CSV 내보내기 실패:", error);
      alert("CSV 파일 내보내기에 실패했습니다.");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const csv = reader.result as string;
          const data = fromCSV(csv); // fromCSV는 첫 번째 섹션만 복원
          localStorage.setItem("practiceRecords", JSON.stringify(data));
          alert("연습 기록(세션) 복원이 완료되었습니다. 곡 목록 및 체크 상태는 복원되지 않습니다. 페이지를 새로고침하여 적용하세요.");
          // 복원 후 페이지 새로고침을 권장
          // window.location.reload(); 
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

  const handleThemeChange = (selectedTheme: "light" | "dark" | "system") => {
    setTheme(selectedTheme);
    // 실제 테마 적용 로직 (CSS 변수 변경 등)은 여기서 구현해야 함
    // 예: document.documentElement.setAttribute('data-theme', selectedTheme);
    localStorage.setItem("theme", selectedTheme);
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
      <Header title="app setting" color="var(--VIVA_MAGENTA)" />

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
                onChange={() => handleThemeChange(opt.value as any)}
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