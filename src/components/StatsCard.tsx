import React, { useState } from "react";
import { generateExportImage } from "../screens/ExportCardModal";
import SessionSelectModal from "./SessionSelectModal"; // 사용자님의 SessionSelectModal 임포트

interface StatsCardProps {
  icon: string;
  iconAlt: string;
  iconWidth: number;
  iconHeight: number;
  title: string;
  value: string;
  onClick?: () => void;
  showExportIcon?: boolean;
  exportIcon?: string;
}

// PracticeRecord 타입 정의 (SessionSelectModal과 일관성 유지)
interface PracticeRecord {
  id: string;
  date: string;
  practiceTime: number;
  startTime: number;
  endTime: number;
  memo?: string;
  track?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  iconAlt,
  iconWidth,
  iconHeight,
  title,
  value,
  onClick,
  showExportIcon = false,
  exportIcon
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 열림/닫힘 상태
  const [sessionsToExport, setSessionsToExport] = useState<PracticeRecord[]>([]); // 모달에 전달할 세션 목록

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  /**
   * 선택된 세션을 실제로 익스포트하는 함수
   * @param session 익스포트할 PracticeRecord 객체
   */
  const exportSelectedSession = async (session: PracticeRecord) => {
    try {
      const nickname = localStorage.getItem("nickname") || "피출러";
      const avatar = localStorage.getItem("avatar") || "";
      const sessionDate = new Date(session.startTime); // Date 객체 사용

      // 날짜를 'YYMMDD 요일' 형식으로 포맷 (예: '240706 토')
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: '2-digit', month: '2-digit', day: '2-digit', weekday: 'short'
      };
      const dateStr = new Intl.DateTimeFormat('ko-KR', dateOptions)
                         .format(sessionDate)
                         .replace(/\./g, '') // 점 제거 (예: 24.07.06 -> 240706)
                         .replace(/ /g, '.') // 공백을 점으로 변경 (예: 240706 토 -> 240706.토)
                         .toUpperCase(); // 요일을 대문자로

      const hours = Math.floor(session.practiceTime / 60);
      const minutes = session.practiceTime % 60;
      
      // --- 디버깅을 위한 console.log 추가 ---
      console.log("--- 익스포트 시간 디버깅 시작 ---");
      console.log("session.practiceTime (분 단위):", session.practiceTime);
      console.log("계산된 시간 (hours):", hours);
      console.log("계산된 분 (minutes):", minutes);
      // --- 디버깅 console.log 끝 ---

      // 시간을 포맷하는 로직 수정:
      let practiceTimeFormatted: string;
      if (hours > 0 && minutes > 0) {
        practiceTimeFormatted = `${hours}시간 ${minutes}분`;
      } else if (hours > 0) { // 분이 0인 경우 (예: 1시간 0분)
        practiceTimeFormatted = `${hours}시간`;
      } else { // 1시간 미만인 경우 (분만 있음)
        practiceTimeFormatted = `${minutes}분`;
      }

      console.log("최종 포맷된 시간:", practiceTimeFormatted);
      console.log("--- 익스포트 시간 디버깅 끝 ---");
      
      const imageDataUrl = await generateExportImage(nickname, dateStr, practiceTimeFormatted, avatar);
      
      const link = document.createElement("a");
      // 다운로드 파일명 생성: '피출러_연습기록_YYYYMMDD_HHMM.png'
      const filenameDate = new Date(session.startTime).toISOString().slice(0, 10).replace(/-/g, ''); //YYYYMMDD
      const filenameTime = new Date(session.startTime).toTimeString().slice(0, 5).replace(/:/g, ''); //HHMM
      link.download = `피출러_연습기록_${filenameDate}_${filenameTime}.png`;
      link.href = imageDataUrl;
      link.click();
      
      alert("익스포트가 완료되었습니다!");
      setIsModalOpen(false); // 익스포트 완료 후 모달 닫기
    } catch (err) {
      console.error("익스포트 실패:", err);
      alert("익스포트에 실패했습니다.");
    }
  };

  /**
   * 익스포트 아이콘 클릭 시 실행되는 핸들러 (모달을 열기 전 데이터 준비)
   * @param e 마우스 이벤트 객체
   */
  const handleExportClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트와 겹치지 않도록 방지
    try {
      const practiceRecords: PracticeRecord[] = JSON.parse(localStorage.getItem("practiceRecords") || "[]");
      const todayKey = new Date().toISOString().slice(0, 10);
      
      // 오늘 날짜의 연습 기록 중 실제 연습 시간(practiceTime)이 0보다 큰 세션만 필터링
      const todaySessions = practiceRecords.filter(
        (r: PracticeRecord) => r.date === todayKey && r.practiceTime > 0
      );
      
      if (todaySessions.length === 0) {
        alert("오늘 익스포트할 연습 기록이 없습니다.");
        return;
      }
      
      setSessionsToExport(todaySessions); // 모달에 전달할 세션 목록 설정
      setIsModalOpen(true); // 세션 선택 모달 열기

    } catch (err) {
      console.error("익스포트 데이터 로딩 실패:", err);
      alert("익스포트에 필요한 데이터를 불러오지 못했습니다.");
    }
  };

  return (
    <>
      <div
        style={{
          width: "calc(100% - 32px)",
          height: 60,
          background: "var(--bg-primary)",
          border: "var(--border-light)",
          borderRadius: "var(--border-radius-large)",
          display: "flex",
          alignItems: "center",
          padding: "16px",
          gap: 12,
          margin: "7px auto 0 auto",
          boxSizing: "border-box",
          fontFamily: "var(--FONT_FAMILY)",
          cursor: onClick ? "pointer" : "default",
          transition: "var(--transition-fast)"
        }}
        onClick={onClick}
      >
        <img src={icon} alt={iconAlt} width={iconWidth} height={iconHeight} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: "20px",
            textAlign: "left",
            ...commonFontStyle
          }}>
            {title}
          </span>
          <span style={{
            fontSize: 12,
            color: "var(--text-primary)",
            lineHeight: "16px",
            textAlign: "left",
            ...commonFontStyle
          }}>
            {value}
          </span>
        </div>
        {showExportIcon && exportIcon && (
          <img
            src={exportIcon}
            alt="export"
            width="16"
            height="20"
            onClick={handleExportClick} // 모달을 여는 핸들러 연결
            style={{
              cursor: "pointer",
              transition: "var(--transition-fast)",
              opacity: 0.8
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
          />
        )}
      </div>

      {/* SessionSelectModal 렌더링 */}
      <SessionSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessions={sessionsToExport} // 모달에 필터링된 세션 목록 전달
        onSelectSession={exportSelectedSession} // 사용자님의 모달이 필요로 하는 프롭 전달
      />
    </>
  );
};

export default StatsCard;