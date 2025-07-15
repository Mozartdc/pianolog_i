// src/screens/SettingsScreen.tsx

import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import Header from "../components/Header";
import AvatarCropper, { AvatarCropperHandles } from "../components/ProfileUploader";
// ✅ [수정] 모든 아이콘을 React 컴포넌트로 불러옵니다.
import ExportIcon from "../assets/icons/s_export.svg?react";
import ImportIcon from "../assets/icons/s_import.svg?react";
import DayIcon from "../assets/icons/day.svg?react";
import NightIcon from "../assets/icons/night.svg?react";
import SystemIcon from "../assets/icons/system.svg?react";
import RadioOn from "../assets/icons/radio_on.svg?react";
import RadioOff from "../assets/icons/radiooff.svg?react";
import Logo from "../utils/img/logo.png";

type Theme = "light" | "dark" | "system";
// ✅ [수정] icon의 타입을 string에서 React.ElementType으로 변경합니다.
const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "light", icon: DayIcon },
  { value: "dark", label: "dark", icon: NightIcon },
  { value: "system", label: "system", icon: SystemIcon },
];

// 타입 정의 (변경 없음)
interface PracticeRecord { id: string; date: string; practiceTime: number; startTime: number; endTime: number; memo?: string; track?: string; }
type Track = { id: number; title: string; addedDate: string; completedDate?: string; };
type PracticeChecks = { [date: string]: { [trackId: number]: boolean; }; };

// CSV 함수 (변경 없음)
function toCSV(practiceRecords: PracticeRecord[], allTracks: Track[], practiceChecks: PracticeChecks): string {
    let csvContent = "";
    const sessionHeaders = ["날짜", "요일", "연습시간", "시작시간", "종료시간", "메모", "해당일_곡_목록"];
    const sessionRows = practiceRecords.map(record => {
        const recordDate = dayjs(record.date);
        const dateStr = record.date;
        const dayOfWeek = recordDate.format("ddd");
        const startTimeFormatted = record.startTime ? dayjs(record.startTime).format("HH:mm:ss") : "";
        const endTimeFormatted = record.endTime ? dayjs(record.endTime).format("HH:mm:ss") : "";
        const totalMinutes = record.practiceTime || 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        let practiceTimeHumanReadable = "0분";
        if (hours > 0 && minutes > 0) practiceTimeHumanReadable = `${hours}시간 ${minutes}분`;
        else if (hours > 0) practiceTimeHumanReadable = `${hours}시간`;
        else if (minutes > 0) practiceTimeHumanReadable = `${minutes}분`;
        const tracksForThisDate: string[] = [];
        const validTracksForDate = allTracks.filter(track => dayjs(track.addedDate).isSameOrBefore(dateStr, 'day') && (!track.completedDate || dayjs(track.completedDate).isSameOrAfter(dateStr, 'day')));
        validTracksForDate.forEach(track => {
            const isChecked = practiceChecks[dateStr]?.[track.id] ? "O" : "X";
            tracksForThisDate.push(`${track.title} (${isChecked})`);
        });
        const tracksListFormatted = tracksForThisDate.length > 0 ? tracksForThisDate.join(", ") : "해당 없음";
        return [record.date, dayOfWeek, practiceTimeHumanReadable, startTimeFormatted, endTimeFormatted, record.memo || "", tracksListFormatted]
            .map(value => {
                const stringValue = String(value);
                if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) return `"${stringValue.replace(/"/g, '""')}"`;
                return stringValue;
            }).join(",");
    });
    csvContent += "=== 연습 세션 기록 ===\n";
    csvContent += sessionHeaders.join(",") + "\n";
    csvContent += sessionRows.join("\n");
    return csvContent;
}
function fromCSV(csv: string): PracticeRecord[] {
    const lines = csv.trim().split("\n");
    if (lines.length === 0) return [];
    const sessionSectionStartIndex = lines.findIndex(line => line.startsWith("=== 연습 세션 기록 ==="));
    if (sessionSectionStartIndex === -1) { console.warn("CSV 복원 실패: 세션 기록 섹션을 찾을 수 없습니다."); return []; }
    const sessionHeaderLine = lines[sessionSectionStartIndex + 1];
    const sessionDataLines = [];
    for (let i = sessionSectionStartIndex + 2; i < lines.length; i++) {
        if (lines[i].startsWith("===") || lines[i].trim() === "") break;
        sessionDataLines.push(lines[i]);
    }
    if (!sessionHeaderLine || sessionDataLines.length === 0) return [];
    const keys = sessionHeaderLine.split(",");
    const headerMap: { [key: string]: keyof PracticeRecord } = { "날짜": "date", "요일": "date", "연습시간": "practiceTime", "시작시간": "startTime", "종료시간": "endTime", "메모": "memo" };
    return sessionDataLines.map(line => {
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const obj: Partial<PracticeRecord> = {};
        let valueIndex = 0;
        keys.forEach(key => {
            const fieldName = headerMap[key.trim()];
            if (key.trim() === "세션ID" || key.trim() === "타이머_연결곡명" || key.trim() === "해당일_곡_목록") { valueIndex++; return; }
            if (fieldName) {
                let parsedValue: any = values[valueIndex];
                if (parsedValue && parsedValue.startsWith('"') && parsedValue.endsWith('"')) { parsedValue = parsedValue.substring(1, parsedValue.length - 1).replace(/""/g, '"'); }
                if (fieldName === "practiceTime") {
                    const hourMatch = (parsedValue as string).match(/(\d+)시간/);
                    const minMatch = (parsedValue as string).match(/(\d+)분/);
                    let totalMinutes = 0;
                    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
                    if (minMatch) totalMinutes += parseInt(minMatch[1]);
                    obj[fieldName] = totalMinutes;
                } else if (fieldName === "startTime" || fieldName === "endTime") {
                    const datePart = obj.date || dayjs().format("YYYY-MM-DD");
                    obj[fieldName] = dayjs(`${datePart}T${parsedValue}`).valueOf();
                } else { obj[fieldName] = parsedValue; }
            }
            valueIndex++;
        });
        obj.id = dayjs().valueOf().toString() + Math.random().toString(36).substring(2, 8);
        obj.track = "";
        return obj as PracticeRecord;
    });
}

interface SettingsScreenProps {
  theme: Theme;
  handleThemeChange: (theme: Theme) => void;
}

export default function SettingScreen({ theme, handleThemeChange }: SettingsScreenProps) {
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "");
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "디붕이");
  const avatarCropperRef = useRef<AvatarCropperHandles>(null);
  
  // 스크롤 방지
useEffect(() => {
  const original = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = original;
  };
}, []);

  
  const commonFontStyle = {
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

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
        const csvContent = toCSV(records, allTracks, checks);
        const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `피출_연습기록_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        alert("연습 기록 CSV 파일이 성공적으로 내보내졌습니다!");
    } catch (error) { console.error("CSV 내보내기 실패:", error); alert("CSV 파일 내보내기에 실패했습니다."); }
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
          alert("연습 기록(세션) 복원이 완료되었습니다. 곡 목록 및 체크 상태는 복원되지 않습니다. 페이지를 새로고침하여 적용하세요.");
        } catch (error) { console.error("Failed to parse CSV:", error); alert("CSV 파일 읽기에 실패했습니다. 올바른 형식의 파일인지 확인해주세요."); }
      };
      reader.readAsText(file, 'UTF-8');
    }
  };
  const handleRegisterAvatarClick = () => { avatarCropperRef.current?.triggerFileInput(); };
  const handleAvatarDelete = () => { setAvatar(""); localStorage.removeItem("avatar"); };

  return (
    <div style={{
      width: "100%", minHeight: "100dvh",
      background: "var(--bg-primary)",
      fontFamily: "var(--FONT_FAMILY)",
      display: "flex", flexDirection: "column", alignItems: "center",
      paddingBottom: 34, paddingTop: 5,
      color: "var(--text-primary)", overflow: "hidden",  position: "fixed",
    }}>
      <div style={{
  width: "calc(100% - 32px)", // ✅ 좌우 16px 여백 추가
  margin: "0 auto" // ✅ 중앙 정렬
}}>
  <Header title="app setting" color="var(--VIVA_MAGENTA)" />
</div>

      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40, width: "90%", maxWidth: 343 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", justifyContent: "flex-start" }}>
          <AvatarCropper ref={avatarCropperRef} onAvatarChange={setAvatar} size={80} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleRegisterAvatarClick} style={{ width: 77, height: 40, background: "var(--button-secondary-bg)", border: "none", borderRadius: 8, color: "var(--text-primary)", fontSize: 14, cursor: "pointer", ...commonFontStyle }}>등록</button>
            <button onClick={handleAvatarDelete} style={{ width: 77, height: 40, background: "var(--button-secondary-bg)", border: "none", borderRadius: 8, color: "var(--text-primary)", fontSize: 14, cursor: "pointer", ...commonFontStyle }}>삭제</button>
          </div>
        </div>
        <div style={{ width: "100%", textAlign: "center", fontSize: 14, marginTop: 26, ...commonFontStyle }}>닉네임 입력 <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>(한글 5자, 영문 8자 미만 권장)</span></div>
        <input value={nickname} onChange={handleNicknameChange} style={{ width: "95%", maxWidth: "100%", height: 40, padding: "8px 16px", borderRadius: 8, border: "var(--border-light)", background: "transparent", color: "var(--text-primary)", fontSize: 16, marginTop: 15, marginBottom: 16, boxSizing: "border-box", ...commonFontStyle }} />
      </div>

      <div style={{ width: "90%", maxWidth: 327, display: "flex", alignItems: "center", gap: 8, margin: "24px auto 16px auto" }}>
        <div style={{ flex: 1, height: 0.5, background: "var(--VIVA_MAGENTA)" }} />
        <span style={{ fontSize: 14, fontWeight: 400, ...commonFontStyle }}>데이터 관리</span>
        <div style={{ flex: 1, height: 0.5, background: "var(--VIVA_MAGENTA)" }} />
      </div>

      {/* ✅ [수정] 내보내기 버튼 아이콘 수정 */}
      <button onClick={handleExport} style={{ width: "90%", maxWidth: 327, height: 40, borderRadius: 8, background: "var(--button-secondary-bg)", border: "none", color: "var(--text-primary)", fontSize: 14, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 8, cursor: "pointer", ...commonFontStyle }}>
        <ExportIcon width={16} height={20} />
        연습 기록 내보내기
      </button>

      {/* ✅ [수정] 가져오기 버튼 아이콘 수정 */}
      <label style={{ width: "90%", maxWidth: 327, height: 40, borderRadius: 8, background: "var(--button-secondary-bg)", border: "none", color: "var(--text-primary)", fontSize: 14, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 18, cursor: "pointer", ...commonFontStyle }}>
        <ImportIcon width={16} height={20} />
        연습 기록 가져오기
        <input type="file" accept=".csv" hidden onChange={handleImport} />
      </label>

      <div style={{ width: "90%", maxWidth: 327, color: "var(--text-secondary)", textAlign: "center", fontSize: 12, lineHeight: "150%", margin: "0 auto 18px auto", ...commonFontStyle }}>
        기기 변경 시 csv로 백업/복원 가능합니다.
      </div>

      <div style={{ width: "90%", maxWidth: 327, display: "flex", alignItems: "center", gap: 8, margin: "0 auto 16px auto" }}>
        <div style={{ flex: 1, height: 0.5, background: "var(--VIVA_MAGENTA)" }} />
        <span style={{ fontSize: 14, ...commonFontStyle }}>display</span>
        <div style={{ flex: 1, height: 0.5, background: "var(--VIVA_MAGENTA)" }} />
      </div>

      <div style={{ display: "flex", width: "90%", maxWidth: 320, justifyContent: "center", alignItems: "center", gap: 14, marginBottom: 32 }}>
        {/* ✅ [수정] 테마 선택 아이콘 렌더링 로직 수정 */}
        {themeOptions.map(opt => {
          const checked = theme === opt.value;
          const Icon = opt.icon;
          return (
            <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", userSelect: "none", color: checked ? "var(--text-primary)" : "var(--text-secondary)" }}>
              {checked ? <RadioOn style={{color: "var(--VIVA_MAGENTA)"}} width={20} height={20} /> : <RadioOff width={20} height={20} />}
              <Icon width={16} height={16} />
              <span style={{ fontSize: 12, ...commonFontStyle }}>{opt.label}</span>
              <input type="radio" name="theme" value={opt.value} checked={checked} onChange={() => handleThemeChange(opt.value)} style={{ display: "none" }} />
            </label>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 10 }}>
        <img src={Logo} alt="logo" width={100} height={65} />
        <span style={{ textAlign: "center", fontSize: 14, lineHeight: "100%", marginTop: 0, ...commonFontStyle }}>digital piano gallery</span>
      </div>
    </div>
  );
}