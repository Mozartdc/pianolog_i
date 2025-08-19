// src/screens/StatsScreen.tsx - 간소화 버전
import React, { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isoWeek from "dayjs/plugin/isoWeek";
import updateLocale from 'dayjs/plugin/updateLocale';
import { validateTimeSettings, logTimeInfo } from "../utils/timeValidation"; // import 추가

import Header from "../components/Header";
import LaurelLeftIcon from "../assets/icons/laurel_L.svg?react";
import LaurelRightIcon from "../assets/icons/laurel_R.svg?react";

import { usePracticeData, PracticeRecord } from "../contexts/PracticeDataContext";
import { TimePickModal } from "./TimePickModal";

// ✅ 분리된 컴포넌트들 import
import { SessionDeleteModal } from "../components/SessionDeleteModal";
import { SessionMemoModal } from "../components/SessionMemoModal";
import { SessionCard } from "../components/SessionCard";
import { StatsCalendar } from "../components/StatsCalendar";
import { StatsCharts } from "../components/StatsCharts";
import { getKoreanHolidays, getWeekData, SessionData } from "../utils/statsUtils";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isoWeek);
dayjs.extend(updateLocale);
dayjs.updateLocale('ko', { weekStart: 1 });

function StatsScreen() {
  const { tracks, practiceRecords, practiceChecks, setPracticeRecords } = usePracticeData();
  
  // UI 상태들
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  // 모달 관련 상태들
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionData | null>(null);
  const [showTimeEditModal, setShowTimeEditModal] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<SessionData | null>(null);
  const [showMemoEditModal, setShowMemoEditModal] = useState(false);
  const [sessionToEditMemo, setSessionToEditMemo] = useState<SessionData | null>(null);

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  // ✅ 함수들을 먼저 정의
  const getSessionsForDate = (date: string): SessionData[] => {
    const dayRecords = practiceRecords.filter(r => r.date === date);
    dayRecords.sort((a, b) => a.startTime - b.startTime);
    return dayRecords.map((record, index) => {
      const hours = Math.floor(record.practiceTime / 60);
      const minutes = record.practiceTime % 60;
      const duration = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
      const start = dayjs(record.startTime).format("HH:mm");
      const end = dayjs(record.endTime).format("HH:mm");
      return { 
        id: record.id, 
        sessionNumber: index + 1, 
        duration, 
        timeRange: `${start}~${end}`, 
        minutes: record.practiceTime, 
        memo: record.memo 
      };
    });
  };

  const getSelectedDateTotalTime = (date: string) => {
    const dayRecords = practiceRecords.filter(r => r.date === date);
    const totalMinutes = dayRecords.reduce((sum, r) => sum + (r.practiceTime || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (totalMinutes === 0) return "0분";
    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  };

  const getSelectedDateTracks = (date: string) => {
  return tracks.filter(track => {
    const addedBeforeOrOn = dayjs(track.addedDate).isSameOrBefore(date, 'day');
    const notCompletedOrCompletedAfter = !track.completedDate || 
                                        dayjs(track.completedDate).isSameOrAfter(date, 'day');
    
    // 🔧 추가: 해당 날짜에 연습 기록이 있으면 포함
    const hasPracticeOnDate = practiceChecks[date] && 
                             Object.keys(practiceChecks[date]).some(trackId => 
                               parseInt(trackId) === track.id && practiceChecks[date][parseInt(trackId)]
                             );
    
    return (addedBeforeOrOn && notCompletedOrCompletedAfter) || hasPracticeOnDate;
  });
};

  // 이제 계산된 값들 정의
  const totalMinutes = practiceRecords.reduce((sum, record) => sum + (record.practiceTime || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const selectedSessions = getSessionsForDate(selectedDate);
  const weekData = getWeekData(selectedDate, practiceRecords, practiceChecks);
  const today = dayjs().format("YYYY-MM-DD");
  const koreanHolidays = getKoreanHolidays(currentMonth.year());

  // ✅ 핸들러 함수들
  const handleSessionClick = (sessionId: string) => {
    setExpandedSessionId(prevId => (prevId === sessionId ? null : sessionId));
  };

  const handleEditSession = (session: SessionData) => {
    setSessionToEdit(session);
    setShowTimeEditModal(true);
  };

  const handleEditMemo = (session: SessionData) => {
    setSessionToEditMemo(session);
    setShowMemoEditModal(true);
  };

  const handleDeleteSession = (session: SessionData) => {
    setSessionToDelete(session);
    setShowDeleteModal(true);
  };

  const confirmDeleteSession = () => {
    if (sessionToDelete) {
      const updatedRecords = practiceRecords.filter(record => record.id !== sessionToDelete.id);
      setPracticeRecords(updatedRecords);
      
      setShowDeleteModal(false);
      setSessionToDelete(null);
      setExpandedSessionId(null);
    }
  };

// ✅ 수정된 시간 업데이트 핸들러 - 타임스탬프 기반 + 날짜 동기화
  const handleTimeUpdate = (startTimestamp: number, endTimestamp: number) => {
    if (!sessionToEdit) return;

    const originalRecord = practiceRecords.find(r => r.id === sessionToEdit.id);
    if (!originalRecord) return;

    console.log('StatsScreen 시간 업데이트:', {
      sessionId: sessionToEdit.id,
      originalRecord,
      startTimestamp,
      endTimestamp,
      startFormatted: dayjs(startTimestamp).format('YYYY-MM-DD HH:mm'),
      endFormatted: dayjs(endTimestamp).format('YYYY-MM-DD HH:mm'),
      currentSelectedDate: selectedDate
    });

    // ✅ 강화된 미래 시간 검증 (HomeScreen과 동일)
    const now = Date.now();
    const oneMinuteLater = now + 60 * 1000; // 1분 여유

    if (startTimestamp > oneMinuteLater) {
      alert("피출 시간은 현재 시간보다 미래로 설정할 수 없습니다.");
      return;
    }

    if (endTimestamp > oneMinuteLater) {
      alert("피퇴 시간은 현재 시간보다 미래로 설정할 수 없습니다.");
      return;
    }

    // ✅ 타임스탬프를 직접 사용하여 정확한 날짜/시간 반영
    const newStartTime = startTimestamp;
    const newEndTime = endTimestamp;
    
    // 기간 계산 (밀리초 → 초 → 분)
const validation = validateTimeSettings(startTimestamp, endTimestamp);
if (!validation.isValid) {
  alert(validation.error);
  return;
}

const newDurationSeconds = (endTimestamp - startTimestamp) / 1000;
const newPracticeTime = Math.floor(newDurationSeconds / 60);
logTimeInfo('StatsScreen 시간 업데이트', startTimestamp, endTimestamp);
    


    // ✅ 날짜도 업데이트 (시작 시간 기준)
    const newDate = dayjs(startTimestamp).format('YYYY-MM-DD');
    const dateChanged = newDate !== originalRecord.date;

    // ✅ 날짜가 바뀐 경우 selectedDate도 업데이트
    if (dateChanged) {
      console.log('📅 StatsScreen 날짜 변경 감지:', {
        기존날짜: originalRecord.date,
        새날짜: newDate,
        현재선택날짜: selectedDate
      });
      setSelectedDate(newDate);
    }

    console.log('시간 계산 결과:', {
      newStartTime: dayjs(newStartTime).format('YYYY-MM-DD HH:mm'),
      newEndTime: dayjs(newEndTime).format('YYYY-MM-DD HH:mm'),
      originalDate: originalRecord.date,
      newDate,
      newDurationSeconds,
      newPracticeTime,
      dateChanged
    });

    const updatedRecord: PracticeRecord = {
      ...originalRecord,
      date: newDate, // ✅ 날짜도 업데이트
      startTime: newStartTime,
      endTime: newEndTime,
      practiceTime: newPracticeTime
    };

    // 레코드 업데이트
    const updatedRecords = practiceRecords.map(record => 
      record.id === sessionToEdit.id ? updatedRecord : record
    );
    
    setPracticeRecords(updatedRecords);
    setShowTimeEditModal(false);
    setSessionToEdit(null);

    console.log('📊 StatsScreen 레코드 업데이트 완료:', {
      updatedRecord,
      총레코드수: updatedRecords.length,
      해당날짜레코드수: updatedRecords.filter(r => r.date === newDate).length,
      선택된날짜: newDate
    });
  };
  const handleMemoUpdate = (memo: string) => {
    if (!sessionToEditMemo) return;

    const updatedRecords = practiceRecords.map(record => 
      record.id === sessionToEditMemo.id 
        ? { ...record, memo: memo || undefined }
        : record
    );
    setPracticeRecords(updatedRecords);
    setSessionToEditMemo(null);
  };

  const handleYearChange = (year: number) => {
    setCurrentMonth(currentMonth.year(year));
    setShowMonthYearPicker(false);
  };

  return (
    <div style={{
      width: "100%", maxWidth: "100%", margin: "0 auto", background: "var(--bg-primary)",
      color: "var(--text-primary)", minHeight: "auto", padding: "0 clamp(0px, 4vw, 20px) 100px",
      boxSizing: "border-box", ...commonFontStyle
    }}>
      {/* Header */}
      <div style={{ 
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "var(--bg-primary)", padding: "0 clamp(0px, 4vw, 20px)", boxShadow: "none"
      }}>
        <Header title="statistics" color="var(--MIMOSA)" topMargin={5} showBackButton={false} />
      </div>

      {/* 총 연습 시간 */}
      <div style={{
        width: "100%", height: 24, margin: "80px auto 0 auto", display: "flex",
        alignItems: "center", justifyContent: "center", gap: "8px", boxSizing: "border-box"
      }}>
        <LaurelLeftIcon style={{ color: "var(--MIMOSA)" }} width="13" height="20" />
        <div style={{ fontSize: 16, textAlign: "center", lineHeight: "24px" }}>
          지금까지 총 <span style={{ fontWeight: 700, color: "var(--MIMOSA)" }}>{totalHours}</span>시간 피출
        </div>
        <LaurelRightIcon style={{ color: "var(--MIMOSA)" }} width="13" height="20" />
      </div>

{/* ✅ 캘린더 컴포넌트 */}
<StatsCalendar
  currentMonth={currentMonth}
  setCurrentMonth={setCurrentMonth}
  selectedDate={selectedDate}
  setSelectedDate={setSelectedDate}
  showMonthYearPicker={showMonthYearPicker}
  setShowMonthYearPicker={setShowMonthYearPicker}
  practiceRecords={practiceRecords}
  practiceChecks={practiceChecks}
  tracks={tracks}
  onYearChange={handleYearChange}
  getSelectedDateTotalTime={getSelectedDateTotalTime}
  getSelectedDateTracks={getSelectedDateTracks}
  koreanHolidays={koreanHolidays}
  commonFontStyle={commonFontStyle}
/>

{/* ✅ 세션 카드들 - 캘린더 바로 아래에 붙이기 */}
<div style={{ marginTop: -5, padding: "0 16px 16px 16px", border: "var(--border-light)", borderTop: "none", borderRadius: "0 0 5px 5px", background: "var(--bg-primary)" }}>
  {selectedSessions.map((session, index) => (
    <SessionCard
      key={session.id}
      session={session}
      index={index}
      isExpanded={expandedSessionId === session.id}
      onSessionClick={handleSessionClick}
      onEditSession={handleEditSession}
      onEditMemo={handleEditMemo}
      onDeleteSession={handleDeleteSession}
      practiceRecords={practiceRecords}
      commonFontStyle={commonFontStyle}
    />
  ))}
</div>

      {/* ✅ 차트 컴포넌트 */}
      <StatsCharts
        weekData={weekData}
        today={today}
        commonFontStyle={commonFontStyle}
      />

      {/* ✅ 모달들 */}
      <SessionDeleteModal
        isOpen={showDeleteModal}
        sessionInfo={sessionToDelete ? `${sessionToDelete.duration} (${sessionToDelete.timeRange})` : ""}
        onConfirm={confirmDeleteSession}
        onClose={() => {
          setShowDeleteModal(false);
          setSessionToDelete(null);
        }}
      />

      {sessionToEdit && (
        <TimePickModal
          isOpen={showTimeEditModal}
          onClose={() => {
            setShowTimeEditModal(false);
            setSessionToEdit(null);
          }}
          onSave={handleTimeUpdate}
          actualStartTime={practiceRecords.find(r => r.id === sessionToEdit.id)?.startTime || null}
          actualEndTime={practiceRecords.find(r => r.id === sessionToEdit.id)?.endTime || null}
        />
      )}

      <SessionMemoModal
        isOpen={showMemoEditModal}
        currentMemo={sessionToEditMemo?.memo || ""}
        onSave={handleMemoUpdate}
        onClose={() => {
          setShowMemoEditModal(false);
          setSessionToEditMemo(null);
        }}
      />
    </div>
  );
}

export default StatsScreen;