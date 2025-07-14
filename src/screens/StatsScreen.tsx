import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import Header from "../components/Header";
import StatsCheckIcon from "../assets/icons/check_s.svg?react";
import StatsUncheckIcon from "../assets/icons/uncheck.svg?react";
import isoWeek from "dayjs/plugin/isoWeek";
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isoWeek);
dayjs.extend(updateLocale);
dayjs.updateLocale('ko', {
  weekStart: 1
});

// 아이콘 imports
import LaurelLeftIcon from "../assets/icons/laurel_L.svg?react";
import LaurelRightIcon from "../assets/icons/laurel_R.svg?react";
import DoIcon from "../assets/icons/do.svg?react";
import HistoryIcon from "../assets/icons/History.svg?react";
import CalLeftIcon from "../assets/icons/cal_left.svg?react";
import CalRightIcon from "../assets/icons/cal_right.svg?react";
import CalDownIcon from "../assets/icons/cal_down.svg?react";
// ✅ [추가] StatsDayDetailModal을 여기서 직접 사용
// ✅ [추가] 중앙 데이터 관리소 사용
import { usePracticeData, PracticeRecord } from "../contexts/PracticeDataContext";

// 타입 정의 (Context에서 가져오므로 대부분 불필요)
interface SessionData {
  id: string;
  sessionNumber: number;
  duration: string;
  timeRange: string;
  minutes: number;
  memo?: string;
}

const getKoreanHolidays = (year: number): string[] => {
  const holidays = [
    `${year}-01-01`, `${year}-03-01`, `${year}-05-05`, `${year}-06-06`,
    `${year}-08-15`, `${year}-10-03`, `${year}-10-09`, `${year}-12-25`,
  ];
  if (year === 2025) {
    holidays.push('2025-01-28', '2025-01-29', '2025-01-30', '2025-05-13', '2025-09-06', '2025-09-07', '2025-09-08');
  }
  return holidays;
};

function StatsScreen() {
  // ✅ [수정] 중앙 데이터 관리소에서 데이터와 함수를 가져옵니다.
  const { tracks, practiceRecords, practiceChecks } = usePracticeData();
  
  // UI를 위한 상태만 남겨둡니다.
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  // ✅ [삭제] 데이터 로딩을 위한 useEffect는 Context에서 처리하므로 삭제합니다.

  const totalMinutes = practiceRecords.reduce((sum, record) => sum + (record.practiceTime || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  // ✅ [추가] 선택된 날짜의 총 연습시간 계산 함수
  const getSelectedDateTotalTime = (date: string) => {
    const dayRecords = practiceRecords.filter(r => r.date === date);
    const totalMinutes = dayRecords.reduce((sum, r) => sum + (r.practiceTime || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (totalMinutes === 0) return "0분";
    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  };

  // ✅ [추가] 선택된 날짜의 모든 연습 가능한 곡 목록 가져오기 함수
  const getSelectedDateTracks = (date: string) => {
    return tracks.filter(track => {
      const isValidDate = dayjs(track.addedDate).isSameOrBefore(date, 'day') && 
                         (!track.completedDate || dayjs(track.completedDate).isSameOrAfter(date, 'day'));
      return isValidDate;
    });
  };

  // 기존 getSessionsForDate 함수 ...

  const getSessionsForDate = (date: string): SessionData[] => {
    const dayRecords = practiceRecords.filter(r => r.date === date);
    dayRecords.sort((a, b) => a.startTime - b.startTime);
    return dayRecords.map((record, index) => {
      const hours = Math.floor(record.practiceTime / 60);
      const minutes = record.practiceTime % 60;
      const duration = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
      const start = dayjs(record.startTime).format("HH:mm");
      const end = dayjs(record.endTime).format("HH:mm");
      return { id: record.id, sessionNumber: index + 1, duration, timeRange: `${start}~${end}`, minutes: record.practiceTime, memo: record.memo };
    });
  };

  const handleSessionClick = (sessionId: string) => {
    setExpandedSessionId(prevId => (prevId === sessionId ? null : sessionId));
  };
  
    const getWeekData = (dateStr: string) => {
    const date = dayjs(dateStr);
    // 0=일, 1=월, ..., 6=토
    const dayOfWeek = date.day();
    const diff = (dayOfWeek + 6) % 7;
    const startOfWeek = date.subtract(diff, "day");
    const weekDates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
    const timeData = weekDates.map(d => {
      const dayRecords = practiceRecords.filter(r => r.date === d.format("YYYY-MM-DD"));
      return dayRecords.reduce((sum, r) => sum + (r.practiceTime || 0), 0) / 60;
    });
    const songData = weekDates.map(d => {
      const checks = practiceChecks[d.format("YYYY-MM-DD")];
      return checks ? Object.values(checks).filter(Boolean).length : 0;
    });
    return { dates: weekDates, timeData, songData, dateRange: `${startOfWeek.format("MMM DD")} - ${startOfWeek.add(6, 'day').format("MMM DD")}` };
  };

  const getDynamicMaxAndTicks = (data: number[], type: 'time' | 'songs') => {
    const actualMax = Math.max(...data, 0);
    let displayMax = 5;
    if (actualMax > 5) {
      displayMax = Math.ceil(actualMax / 5) * 5;
    }
    const ticks = Array.from({ length: 6 }, (_, i) => displayMax - (i * (displayMax / 5)));
    const formattedTicks = ticks.map(tick => type === 'time' ? parseFloat(tick.toFixed(1)) : Math.round(tick));
    return { maxValue: displayMax, ticks: formattedTicks };
  };

  const calculateBarHeight = (value: number, maxValue: number) => {
    const MAX_HEIGHT = 70;
    const MIN_HEIGHT = 2;
    if (maxValue === 0 || value === 0) return MIN_HEIGHT;
    const ratio = value / maxValue;
    return Math.max(MIN_HEIGHT, Math.min(ratio * MAX_HEIGHT, MAX_HEIGHT));
  };

const generateCalendarDays = () => {
  // 1. 이번 달 1일
  let startOfMonth = currentMonth.startOf('month');
  // 2. 이번 달 1일의 요일 (0=일, 1=월, ..., 6=토)
  const dayOfWeek = startOfMonth.day();
  // 3. 월요일이 1이므로, 1일이 월요일이 아니면 그 전 월요일로 이동
  // (dayOfWeek === 1이면 그대로, 아니면 -1 ~ -6만큼 빼줌)
  const diff = (dayOfWeek + 6) % 7; // 1일이 월요일이면 0, 화요일이면 1, ..., 일요일이면 6
  startOfMonth = startOfMonth.subtract(diff, 'day');

  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(startOfMonth.add(i, 'day'));
  }
  return days;
};

  const calendarDays = generateCalendarDays();
  const weeks: dayjs.Dayjs[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const selectedSessions = getSessionsForDate(selectedDate);
  const weekData = getWeekData(selectedDate);
  const today = dayjs().format("YYYY-MM-DD");
  const koreanHolidays = getKoreanHolidays(currentMonth.year());

  const { maxValue: timeMaxValue, ticks: timeTicks } = getDynamicMaxAndTicks(weekData.timeData, 'time');
  const { maxValue: songMaxValue, ticks: songTicks } = getDynamicMaxAndTicks(weekData.songData, 'songs');

  const handleYearChange = (year: number) => {
    setCurrentMonth(currentMonth.year(year));
    setShowMonthYearPicker(false);
  };
  console.log("현재 선택된 날짜:", selectedDate);

  return (
    <div style={{
      width: "100%", maxWidth: "100%", margin: "0 auto", background: "var(--bg-primary)",
      color: "var(--text-primary)", minHeight: "100dvh", paddingBottom: "100px",
      boxSizing: "border-box", ...commonFontStyle
    }}>
      {/* ✅ 헤더를 감싸는 div를 추가하고 sticky 관련 스타일을 적용합니다. */}
      <div style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 10, 
        background: "var(--bg-primary)" 
      }}>
        <Header title="statistics" color="var(--MIMOSA)" topMargin={5} showBackButton={false} />
      </div>

      {/* 총 연습 시간 */}
      <div style={{
        width: "100%",
        height: 24,
        margin: "25px auto 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center", // ✅ 'space-between'에서 'center'로 변경
        gap: "8px",                 // ✅ 아이콘과 텍스트 사이 간격을 위해 추가
        boxSizing: "border-box"
      }}>
        <LaurelLeftIcon style={{ color: "var(--MIMOSA)" }} width="13" height="20" />
        <div style={{
          fontSize: 16,
          textAlign: "center",
          lineHeight: "24px"
          // ✅ flex: 1 속성은 더 이상 필요 없으므로 제거
        }}>
          지금까지 총 <span style={{ fontWeight: 700, color: "var(--MIMOSA)" }}>{totalHours}</span>시간 피출
        </div>
        <LaurelRightIcon style={{ color: "var(--MIMOSA)" }} width="13" height="20" />
      </div>

      <div style={{
        width: "100%", margin: "25px auto 0 auto", padding: "16px 0", border: "var(--border-light)",
        borderRadius: 5, background: "var(--bg-primary)", boxSizing: "border-box"
      }}>
{/* 캘린더 헤더 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          padding: "0 16px",
        }}>
          {/* ✅ [수정] 버튼과 드롭다운을 함께 묶는 div를 추가하고, 여기에 position: 'relative'를 적용합니다. */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text-secondary)", background: "none", border: "none" }}
            >
              <span style={{ fontSize: 16, ...commonFontStyle }}>{currentMonth.format("YYYY년 MM월")}</span>
              <CalDownIcon
                width="9"
                height="6"
                style={{
                  transform: showMonthYearPicker ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              />
            </button>

            {/* 월/년 선택기 UI */}
            {showMonthYearPicker && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0, // ✅ 버튼 바로 아래, 왼쪽에 정렬됩니다.
                width: '120px',
                background: 'var(--PASTEL_MIMOSA)',
                border: 'var(--border-light)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-light)',
                zIndex: 100,
                marginTop: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* ✅ [수정] 20년 범위로 더 많은 년도를 표시합니다. */}
                {Array.from({ length: 30 }, (_, i) => {
                  const year = dayjs().year() - 10 + i;
                  return (
                    <div
                      key={year}
                      onClick={() => handleYearChange(year)}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: 14,
                        textAlign: 'center',
                        color: 'var(--text-primary)',
                        flexShrink: 0
                      }}
                    >
                      {year}년
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 좌/우 이동 버튼 */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setCurrentMonth(currentMonth.subtract(1, 'month'));
                setShowMonthYearPicker(false);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <CalLeftIcon width="14" height="8" />
            </button>
            <button
              onClick={() => {
                setCurrentMonth(currentMonth.add(1, 'month'));
                setShowMonthYearPicker(false);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <CalRightIcon width="14" height="8" />
            </button>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "min(6px, 1.5vw)", marginBottom: 8, padding: "0 16px" }}>
          {["m", "t", "w", "t", "f", "s", "s"].map((day, index) => (
            <div key={index} style={{ fontSize: 16, color: index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)", textAlign: "center", ...commonFontStyle }}>
              {day}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "min(6px, 1.5vw)", marginBottom: 8, padding: "0 16px" }}>
            {week.map((date, dayIndex) => {
              const dateStr = date.format("YYYY-MM-DD");
              const isCurrentMonth = date.month() === currentMonth.month();
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === today;
              const isHoliday = koreanHolidays.includes(dateStr);
              const isFuture = date.isAfter(dayjs(), 'day');
              const practiced = practiceRecords.some(r => r.date === dateStr && r.practiceTime > 0) ||
                (practiceChecks[dateStr] && Object.values(practiceChecks[dateStr]).some(Boolean));
              return (
                <div key={dayIndex}
                  onClick={() => { if(isCurrentMonth && !isFuture) { setSelectedDate(dateStr); } }}
                  style={{
                    aspectRatio: "1", minWidth: 0, display: "flex",
                    alignItems: "center", justifyContent: "center", position: "relative",
                    cursor: isCurrentMonth && !isFuture ? "pointer" : "pointer",
                    opacity: isCurrentMonth ? 1 : 0.3, boxSizing: "border-box"
                  }}
                >
                  {practiced && <DoIcon style={{ color: "var(--PASTEL_MIMOSA)", width: "100%", height: "100%", maxWidth: 32, maxHeight: 32, position: "absolute", zIndex: 1, opacity: 0.8 }} />}
<span style={{
  fontSize: "clamp(12px, 4vw, 16px)",
  color: (dayIndex === 6 || isHoliday ? "var(--VIVA_MAGENTA)" : "var(--text-primary)"),
  fontWeight: isToday ? 700 : 400, // ✅ 오늘만 굵게, 나머지는 보통
  zIndex: 2, position: "relative",
  border: isSelected ? "3px solid var(--VIVA_MAGENTA)" : "none",
  background: "transparent",
  borderRadius: "50%",
  width: isToday || isSelected ? "100%" : "auto",
  height: isToday || isSelected ? "100%" : "auto",
  maxWidth: 32, maxHeight: 32,
  display: "flex", alignItems: "center", justifyContent: "center",
  ...commonFontStyle
}}>
  {date.date()}
</span>

                </div>
              );
            })}
          </div>
        ))}
        
      {/* ✅ [추가] 선택된 날짜 정보 UI */}
        <div style={{
          margin: "16px auto 0 auto",
          padding: "16px",
          width: "calc(100% - 36px)",
          background: "transparent",
          border: "1px solid var(--MIMOSA)",
          borderRadius: 8,
          ...commonFontStyle
        }}>
          {/* 선택된 날짜 */}
          <div style={{
            fontSize: 18,
            color: "var(--MIMOSA)",
            fontWeight: 400,
            marginBottom: 12
          }}>
            {dayjs(selectedDate).format("YYYY년 MM월 DD일")} ({dayjs(selectedDate).format("ddd").toLowerCase()})
          </div>
          
          {/* 총 연습시간 */}
          <div style={{
            fontSize: 14,
            color: "var(--text-primary)",
            marginBottom: 12
          }}>
            총 연습시간: <span style={{ color: "var(--MIMOSA)", fontWeight: "bold" }}>
              {getSelectedDateTotalTime(selectedDate)}
            </span>
          </div>
          
        

          {/* 연습한 곡 목록 */}
          <div style={{
            borderTop: "1px solid var(--border-light)",
            paddingTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}>
            <span style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>연습한 곡:</span>
            {getSelectedDateTracks(selectedDate).length > 0 ? (
              getSelectedDateTracks(selectedDate).map(track => {
                const isChecked = !!(practiceChecks[selectedDate] && practiceChecks[selectedDate][track.id]);
                return (
                  <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 8, color: isChecked ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {isChecked ? <StatsCheckIcon style={{color: "var(--MIMOSA)"}} width="14" height="14" /> : <StatsUncheckIcon width="14" height="14" />}
                    <span style={{ fontSize: 14, ...commonFontStyle }}>{track.title}</span>
                  </div>
                );
              })
            ) : (
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>연습한 곡이 없습니다.</span>
            )}
          </div>
        </div>



        <div style={{ marginTop: 16, padding: "0 16px" }}>
          {selectedSessions.map((session, index) => {
            const isExpanded = expandedSessionId === session.id;
            return (
              <React.Fragment key={session.id}>
                <div onClick={() => handleSessionClick(session.id)}
                  style={{
                    width: "100%", height: 32, margin: index === 0 ? "0 auto" : "10px auto 0 auto",
                    padding: "6px 10px", border: "1px solid var(--MIMOSA)", borderRadius: 5,
                    display: "flex", alignItems: "center", gap: 8, background: "var(--bg-primary)",
                    boxSizing: "border-box", cursor: "pointer", position: 'relative',
                    color: "var(--MIMOSA)"
                  }}
                >
                  <HistoryIcon width="16" height="16" />
                  <div style={{ fontSize: 14, color: "var(--text-primary)", flex: 1, overflow: "hidden", ...commonFontStyle }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>session {session.sessionNumber}. </span>
                    {session.duration} ({session.timeRange})
                  </div>
                  <CalDownIcon width="9" height="6" style={{ transform: isExpanded ? 'rotate(180deg)' : 'transition', transition: 'transform 0.2s', position: 'absolute', right: '10px' }} />
                </div>
                {isExpanded && (
                  <div style={{
                      width: "100%", padding: "10px 15px", background: "var(--info-bg)",
                      border: "var(--border-light)", borderRadius: 5, marginTop: 5, marginBottom: 5,
                      boxSizing: "border-box", fontSize: 13, color: "var(--text-secondary)", ...commonFontStyle
                  }}>
                    메모: {session.memo || "작성된 메모가 없습니다."}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>



      <div style={{ display: "flex", gap: "min(12px, 3vw)", margin: "10px auto 0 auto", width: "100%", boxSizing: "border-box", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: "calc(50% - min(12px, 3vw) / 2)", height: 161, padding: 10, border: "var(--border-light)", borderRadius: 5, background: "var(--bg-primary)", boxSizing: "border-box" }}>
          <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 4, ...commonFontStyle }}>주간 피출 시간</div>
          <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 12, ...commonFontStyle }}>{weekData.dateRange}</div>
          <div style={{ display: "flex", height: 70, marginBottom: 8 }}>
            <div style={{ width: 25, height: 70, position: "relative", marginRight: 5, flexShrink: 0 }}>
              {timeTicks.map((hour, index) => (
                <div key={index} style={{ position: "absolute", top: `${index * (100 / (timeTicks.length - 1))}%`, transform: 'translateY(-50%)', left: 0, fontSize: 10, color: "var(--text-secondary)", lineHeight: 1, ...commonFontStyle }}>
                  {hour}h
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "end", height: 70, flex: 1, minWidth: 0 }}>
              {weekData.timeData.map((value, index) => {
                const isToday = weekData.dates[index].format("YYYY-MM-DD") === today;
                const height = calculateBarHeight(value, timeMaxValue);
                return <div key={index} style={{ flex: "1 1 0", height: height, backgroundColor: isToday ? "var(--MIMOSA)" : "var(--PASTEL_MIMOSA)", borderRadius: 2, marginRight: index < 6 ? 2 : 0, minWidth: 0 }} />;
              })}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 12, ...commonFontStyle }}>
            <div style={{ width: 30, flexShrink: 0 }} />
            <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
              {["m", "t", "w", "t", "f", "s", "s"].map((day, index) => (
                <div key={index} style={{ flex: "1 1 0", textAlign: "center", color: index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)", marginRight: index < 6 ? 2 : 0, minWidth: 0 }}>
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: "calc(50% - min(12px, 3vw) / 2)", height: 161, padding: 10, border: "var(--border-light)", borderRadius: 5, background: "var(--bg-primary)", boxSizing: "border-box" }}>
          <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 4, ...commonFontStyle }}>주간 연습 곡</div>
          <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 12, ...commonFontStyle }}>{weekData.dateRange}</div>
          <div style={{ display: "flex", height: 70, marginBottom: 8 }}>
            <div style={{ width: 25, height: 70, position: "relative", marginRight: 5, flexShrink: 0 }}>
              {songTicks.map((songs, index) => (
                <div key={index} style={{ position: "absolute", top: `${index * (100 / (songTicks.length - 1))}%`, transform: 'translateY(-50%)', left: 0, fontSize: 10, color: "var(--text-secondary)", lineHeight: 1, ...commonFontStyle }}>
                  {songs}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "end", height: 70, flex: 1, minWidth: 0 }}>
              {weekData.songData.map((value, index) => {
                const isToday = weekData.dates[index].format("YYYY-MM-DD") === today;
                const height = calculateBarHeight(value, songMaxValue);
                return <div key={index} style={{ flex: "1 1 0", height: height, backgroundColor: isToday ? "var(--MIMOSA)" : "var(--PASTEL_MIMOSA)", borderRadius: 2, marginRight: index < 6 ? 2 : 0, minWidth: 0 }} />;
              })}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 12, ...commonFontStyle }}>
            <div style={{ width: 30, flexShrink: 0 }} />
            <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
              {["m", "t", "w", "t", "f", "s", "s"].map((day, index) => (
                <div key={index} style={{ flex: "1 1 0", textAlign: "center", color: index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)", marginRight: index < 6 ? 2 : 0, minWidth: 0 }}>
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsScreen;
