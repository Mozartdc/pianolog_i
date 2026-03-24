// src/screens/StatsScreen.tsx - simplified version
import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isoWeek from "dayjs/plugin/isoWeek";
import updateLocale from 'dayjs/plugin/updateLocale';
import { validateTimeSettings, logTimeInfo } from "../utils/timeValidation"; // added import

import Header from "../components/Header";
import LaurelLeftIcon from "../assets/icons/laurel_L.svg?react";
import LaurelRightIcon from "../assets/icons/laurel_R.svg?react";
import FlameIcon from "../assets/icons/flame.svg?react";
import StatsCheckIcon from "../assets/icons/check_s.svg?react";
import StatsUncheckIcon from "../assets/icons/uncheck.svg?react";

import { usePracticeData, PracticeRecord } from "../contexts/PracticeDataContext";
import { TimePickModal } from "./TimePickModal";

// Import separated components
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

function TrendLineMiniChart({
  values,
  labels,
  accentColor,
  commonFontStyle
}: {
  values: number[];
  labels: string[];
  accentColor: string;
  commonFontStyle: React.CSSProperties;
}) {
  const chartWidth = 320;
  const chartHeight = 92;
  const horizontalPadding = 16;
  const verticalPadding = 12;
  const stepX = (chartWidth - horizontalPadding * 2) / Math.max(values.length - 1, 1);
  const maxValue = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = horizontalPadding + stepX * index;
    const y = chartHeight - verticalPadding - ((value / maxValue) * (chartHeight - verticalPadding * 2));
    return { x, y };
  });
  const polylinePoints = points.map(point => `${point.x},${point.y}`).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ width: "100%", height: 110, display: "block", overflow: "visible" }}
      >
        {[0, 0.5, 1].map((ratio, index) => {
          const y = chartHeight - verticalPadding - ratio * (chartHeight - verticalPadding * 2);
          return (
            <line
              key={index}
              x1={horizontalPadding}
              y1={y}
              x2={chartWidth - horizontalPadding}
              y2={y}
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />
          );
        })}

        <polyline
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polylinePoints}
        />

        {points.map((point, index) => (
          <circle
            key={`${labels[index]}-${index}`}
            cx={point.x}
            cy={point.y}
            r={3.5}
            fill="var(--bg-primary)"
            stroke={accentColor}
            strokeWidth={1.5}
          />
        ))}
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 2 }}>
        {labels.map((label, index) => (
          <div
            key={`${label}-${index}`}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 11,
              color: "var(--text-secondary)",
              ...commonFontStyle
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsScreen() {
  const { tracks, practiceRecords, practiceChecks, setPracticeRecords } = usePracticeData();
  
  // UI states
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [showCalendarDetailModal, setShowCalendarDetailModal] = useState(false);

  // Modal related states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionData | null>(null);
  const [showTimeEditModal, setShowTimeEditModal] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<SessionData | null>(null);
  const [showMemoEditModal, setShowMemoEditModal] = useState(false);
  const [sessionToEditMemo, setSessionToEditMemo] = useState<SessionData | null>(null);
  const [expandedTrend, setExpandedTrend] = useState<"month" | "year" | null>(null);

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  // Define functions first
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
    
    // Added: Include if there's practice record on that date
    const hasPracticeOnDate = practiceChecks[date] && 
                             Object.keys(practiceChecks[date]).some(trackId => 
                               parseInt(trackId) === track.id && practiceChecks[date][parseInt(trackId)]
                             );
    
    return (addedBeforeOrOn && notCompletedOrCompletedAfter) || hasPracticeOnDate;
  });
};

  const getDayMinutes = (date: string) =>
    practiceRecords
      .filter(record => record.date === date)
      .reduce((sum, record) => sum + Number(record.practiceTime || 0), 0);

  const hasCheckedTrackOnDate = (date: string) =>
    !!(practiceChecks[date] && Object.values(practiceChecks[date]).some(Boolean));

  const hasActivityOnDate = (date: string) =>
    getDayMinutes(date) > 0 || hasCheckedTrackOnDate(date);

  const weekData = getWeekData(selectedDate, practiceRecords, practiceChecks);

  const currentStreak = useMemo(() => {
    let streak = 0;
    let cursor = dayjs();

    if (!hasActivityOnDate(cursor.format("YYYY-MM-DD"))) {
      cursor = cursor.subtract(1, "day");
    }

    while (hasActivityOnDate(cursor.format("YYYY-MM-DD"))) {
      streak++;
      cursor = cursor.subtract(1, "day");
      if (streak > 365) break;
    }

    return streak;
  }, [practiceRecords, practiceChecks]);

  const weekPracticeDays = useMemo(
    () => weekData.dates.filter(date => hasActivityOnDate(date.format("YYYY-MM-DD"))).length,
    [weekData, practiceRecords, practiceChecks]
  );

  const monthPracticeDays = useMemo(() => {
    const monthStart = dayjs().startOf("month");
    const monthEnd = dayjs().endOf("month");
    let count = 0;

    for (let cursor = monthStart; cursor.isSameOrBefore(monthEnd, "day"); cursor = cursor.add(1, "day")) {
      if (hasActivityOnDate(cursor.format("YYYY-MM-DD"))) {
        count++;
      }
    }

    return count;
  }, [practiceRecords, practiceChecks]);

  const previousWeekData = useMemo(
    () => getWeekData(dayjs(selectedDate).subtract(7, "day").format("YYYY-MM-DD"), practiceRecords, practiceChecks),
    [selectedDate, practiceRecords, practiceChecks]
  );

  const formatMinutesHuman = (minutes: number) => {
    if (minutes <= 0) return "0분";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
    if (hours > 0) return `${hours}시간`;
    return `${mins}분`;
  };

  const timeSummary = useMemo(() => {
    const currentWeekMinutes = Math.round(weekData.timeData.reduce((sum, value) => sum + value, 0) * 60);
    const previousWeekMinutes = Math.round(previousWeekData.timeData.reduce((sum, value) => sum + value, 0) * 60);
    const diffMinutes = currentWeekMinutes - previousWeekMinutes;

    if (diffMinutes === 0) {
      return `총 ${formatMinutesHuman(currentWeekMinutes)} · 지난주와 같음`;
    }

    const direction = diffMinutes > 0 ? "+" : "-";
    return `총 ${formatMinutesHuman(currentWeekMinutes)} · 지난주보다 ${direction}${formatMinutesHuman(Math.abs(diffMinutes))}`;
  }, [weekData, previousWeekData]);

  const songSummary = useMemo(() => {
    const totalSongs = weekData.songData.reduce((sum, value) => sum + value, 0);
    const averageSongs = Math.floor(totalSongs / 7);
    return `총 ${totalSongs}곡 · 일평균 ${averageSongs}곡`;
  }, [weekData]);

  const currentMonthMinutes = useMemo(() => {
    const start = dayjs().startOf("month");
    const end = dayjs().endOf("month");
    return practiceRecords
      .filter(record => {
        const date = dayjs(record.date);
        return date.isSameOrAfter(start, "day") && date.isSameOrBefore(end, "day");
      })
      .reduce((sum, record) => sum + Number(record.practiceTime || 0), 0);
  }, [practiceRecords]);

  const currentYearMinutes = useMemo(() => {
    const start = dayjs().startOf("year");
    const end = dayjs().endOf("year");
    return practiceRecords
      .filter(record => {
        const date = dayjs(record.date);
        return date.isSameOrAfter(start, "day") && date.isSameOrBefore(end, "day");
      })
      .reduce((sum, record) => sum + Number(record.practiceTime || 0), 0);
  }, [practiceRecords]);

  const currentYearPracticeDays = useMemo(() => {
    const start = dayjs().startOf("year");
    const end = dayjs().endOf("year");
    let count = 0;

    for (let cursor = start; cursor.isSameOrBefore(end, "day"); cursor = cursor.add(1, "day")) {
      if (hasActivityOnDate(cursor.format("YYYY-MM-DD"))) count++;
    }

    return count;
  }, [practiceRecords, practiceChecks]);

  const monthTrendData = useMemo(() => {
    const start = dayjs().startOf("month");
    return Array.from({ length: 5 }, (_, index) => {
      const weekStart = start.add(index * 7, "day");
      const weekEnd = weekStart.add(6, "day");
      const minutes = practiceRecords
        .filter(record => {
          const date = dayjs(record.date);
          return date.isSameOrAfter(weekStart, "day") && date.isSameOrBefore(weekEnd, "day");
        })
        .reduce((sum, record) => sum + Number(record.practiceTime || 0), 0);
      return Math.round(minutes / 60);
    });
  }, [practiceRecords]);

  const yearTrendData = useMemo(() => {
    const start = dayjs().startOf("year");
    return Array.from({ length: 12 }, (_, index) => {
      const monthStart = start.add(index, "month").startOf("month");
      const monthEnd = monthStart.endOf("month");
      const minutes = practiceRecords
        .filter(record => {
          const date = dayjs(record.date);
          return date.isSameOrAfter(monthStart, "day") && date.isSameOrBefore(monthEnd, "day");
        })
        .reduce((sum, record) => sum + Number(record.practiceTime || 0), 0);
      return Math.round(minutes / 60);
    });
  }, [practiceRecords]);

  const heatmapDates = useMemo(
    () => Array.from({ length: 200 }, (_, index) => dayjs().subtract(199 - index, "day")),
    []
  );

  const getHeatmapLevel = (dateStr: string) => {
    if (!hasCheckedTrackOnDate(dateStr)) return 0;
    const minutes = getDayMinutes(dateStr);
    if (minutes >= 120) return 3;
    if (minutes >= 60) return 2;
    return 1;
  };

  const levelColors = [
    "#FFFFFF",
    "rgba(242, 201, 76, 0.35)",
    "rgba(242, 201, 76, 0.7)",
    "var(--TURQUOISE)"
  ];

  // Now define calculated values
  const totalMinutes = practiceRecords.reduce((sum, record) => sum + (record.practiceTime || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const selectedSessions = getSessionsForDate(selectedDate);
  const today = dayjs().format("YYYY-MM-DD");
  const koreanHolidays = getKoreanHolidays(currentMonth.year());
  const todaySummaryTracks = getSelectedDateTracks(today);
  const todaySummaryTime = getSelectedDateTotalTime(today);

  // Handler functions
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

// Modified time update handler - timestamp based + date sync
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

    // Enhanced future time validation (same as HomeScreen)
    const now = Date.now();
    const oneMinuteLater = now + 60 * 1000; // 1 minute buffer

    if (startTimestamp > oneMinuteLater) {
      alert("피출 시간은 현재 시간보다 미래로 설정할 수 없습니다.");
      return;
    }

    if (endTimestamp > oneMinuteLater) {
      alert("피퇴 시간은 현재 시간보다 미래로 설정할 수 없습니다.");
      return;
    }

    // Use timestamp directly for accurate date/time reflection
    const newStartTime = startTimestamp;
    const newEndTime = endTimestamp;
    
    // Calculate duration (milliseconds → seconds → minutes)
const validation = validateTimeSettings(startTimestamp, endTimestamp);
if (!validation.isValid) {
  alert(validation.error);
  return;
}

const newDurationSeconds = (endTimestamp - startTimestamp) / 1000;
const newPracticeTime = Math.floor(newDurationSeconds / 60);
logTimeInfo('StatsScreen 시간 업데이트', startTimestamp, endTimestamp);
    


    // Also update date (based on start time)
    const newDate = dayjs(startTimestamp).format('YYYY-MM-DD');
    const dateChanged = newDate !== originalRecord.date;

    // Update selectedDate if date changed
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
      date: newDate, // Also update date
      startTime: newStartTime,
      endTime: newEndTime,
      practiceTime: newPracticeTime
    };

    // Update record
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

      {/* Total practice time */}
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

      <div style={{
        width: "100%",
        margin: "16px auto 0 auto",
        fontSize: 14,
        color: "var(--text-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        flexWrap: "wrap",
        ...commonFontStyle
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>현재</span>
          {currentStreak > 0 ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <FlameIcon
                width="14"
                height="18"
                style={{ color: "var(--LIVING_CORAL)", flexShrink: 0 }}
              />
              <span style={{ color: "var(--MIMOSA)", fontWeight: 700 }}>
                {currentStreak}
              </span>
            </span>
          ) : (
            <span style={{ color: "var(--MIMOSA)", fontWeight: 700 }}>{currentStreak}</span>
          )}
          <span>일 연속</span>
        </div>
        <span style={{ color: "var(--text-secondary)" }}>·</span>
        <div>
          이번 주 <span style={{ color: "var(--MIMOSA)", fontWeight: 700 }}>{weekPracticeDays}</span>일
        </div>
        <span style={{ color: "var(--text-secondary)" }}>·</span>
        <div>
          이번 달 <span style={{ color: "var(--MIMOSA)", fontWeight: 700 }}>{monthPracticeDays}</span>일
        </div>
      </div>

      <div style={{
        width: "100%", margin: "14px auto 0 auto", padding: "0 6px",
        background: "transparent", boxSizing: "border-box"
      }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, ...commonFontStyle }}>
          최근 200일 기록
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(40, minmax(0, 1fr))",
          gap: 1,
          width: "100%"
        }}>
          {heatmapDates.map(date => {
            const level = getHeatmapLevel(date.format("YYYY-MM-DD"));
            return (
              <div
                key={date.format("YYYY-MM-DD")}
                title={`${date.format("YYYY-MM-DD")} · ${formatMinutesHuman(getDayMinutes(date.format("YYYY-MM-DD")))}`}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 2,
                  background: levelColors[level],
                  border: level === 0 ? "1px solid rgba(0, 0, 0, 0.16)" : "none",
                  boxSizing: "border-box"
                }}
              />
            );
          })}
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 12, gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)", ...commonFontStyle }}>
            <span>적음</span>
            {levelColors.map(color => (
              <span
                key={color}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: color,
                  border: color === levelColors[0] ? "1px solid rgba(0, 0, 0, 0.16)" : "none",
                  boxSizing: "border-box"
                }}
              />
            ))}
            <span>많음</span>
          </div>

          <button
            onClick={() => setShowCalendarDetailModal(true)}
            style={{
              background: "transparent",
              border: "1px solid var(--MIMOSA)",
              borderRadius: 999,
              color: "var(--MIMOSA)",
              padding: "7px 12px",
              fontSize: 12,
              cursor: "pointer",
              ...commonFontStyle
            }}
          >
            달력 상세 보기
          </button>
        </div>
      </div>

      <div style={{
        width: "100%",
        margin: "16px auto 0 auto",
        padding: "16px",
        border: "var(--border-light)",
        borderRadius: 5,
        background: "var(--bg-primary)",
        boxSizing: "border-box"
      }}>
        <div style={{ fontSize: 16, color: "var(--text-primary)", fontWeight: 700, marginBottom: 6, ...commonFontStyle }}>
          오늘의 연습
        </div>
        <div style={{ fontSize: 13, color: "var(--MIMOSA)", marginBottom: 12, ...commonFontStyle }}>
          {dayjs(today).format("YYYY년 MM월 DD일")} ({dayjs(today).format("ddd").toLowerCase()})
        </div>
        <div style={{ fontSize: 14, color: "var(--text-primary)", marginBottom: 12, ...commonFontStyle }}>
          총 연습시간: <span style={{ color: "var(--MIMOSA)", fontWeight: 700 }}>{todaySummaryTime}</span>
        </div>
        <div style={{
          borderTop: "1px solid var(--border-light)",
          paddingTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", ...commonFontStyle }}>
            연습한 곡
          </div>
          {todaySummaryTracks.length > 0 ? todaySummaryTracks.map(track => {
            const isChecked = !!(practiceChecks[today] && practiceChecks[today][track.id]);
            return (
              <div
                key={track.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: isChecked ? "var(--text-primary)" : "var(--text-secondary)"
                }}
              >
                {isChecked ? (
                  <StatsCheckIcon style={{ color: "var(--MIMOSA)", flexShrink: 0 }} width="14" height="14" />
                ) : (
                  <StatsUncheckIcon style={{ flexShrink: 0 }} width="14" height="14" />
                )}
                <span style={{ fontSize: 14, ...commonFontStyle }}>{track.title}</span>
              </div>
            );
          }) : (
            <div style={{ fontSize: 14, color: "var(--text-secondary)", ...commonFontStyle }}>
              아직 연습한 곡이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* Chart component */}
      <StatsCharts
        weekData={weekData}
        today={today}
        commonFontStyle={commonFontStyle}
        timeSummary={timeSummary}
        songSummary={songSummary}
      />

      <div style={{
        display: "flex",
        gap: 10,
        margin: "14px auto 0 auto",
        width: "100%"
      }}>
        {[
          { key: "month" as const, label: "월간 보기" },
          { key: "year" as const, label: "연간 보기" }
        ].map(item => {
          const active = expandedTrend === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setExpandedTrend(prev => prev === item.key ? null : item.key)}
              style={{
                flex: 1,
                height: 36,
                background: "transparent",
                border: `1px solid ${active ? "var(--MIMOSA)" : "rgba(0,0,0,0.12)"}`,
                borderRadius: 999,
                color: active ? "var(--MIMOSA)" : "var(--text-secondary)",
                cursor: "pointer",
                boxSizing: "border-box",
                ...commonFontStyle
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{
        width: "100%",
        maxHeight: expandedTrend ? 320 : 0,
        opacity: expandedTrend ? 1 : 0,
        overflow: "hidden",
        transition: "max-height 0.25s ease, opacity 0.2s ease, margin-top 0.2s ease",
        marginTop: expandedTrend ? 12 : 0
      }}>
        <div style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 5,
          background: "var(--bg-primary)",
          padding: "16px",
          boxSizing: "border-box"
        }}>
          {expandedTrend === "month" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", ...commonFontStyle }}>
                이번 달
              </div>
              <div style={{ fontSize: 14, color: "var(--text-primary)", ...commonFontStyle }}>
                총 연습시간: <span style={{ color: "var(--MIMOSA)", fontWeight: 700 }}>{formatMinutesHuman(currentMonthMinutes)}</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-primary)", ...commonFontStyle }}>
                연습한 날: <span style={{ color: "var(--MIMOSA)", fontWeight: 700 }}>{monthPracticeDays}일</span>
              </div>
              <TrendLineMiniChart
                values={monthTrendData}
                labels={["1", "2", "3", "4", "5"]}
                accentColor="var(--MIMOSA)"
                commonFontStyle={commonFontStyle}
              />
            </div>
          )}

          {expandedTrend === "year" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", ...commonFontStyle }}>
                올해
              </div>
              <div style={{ fontSize: 14, color: "var(--text-primary)", ...commonFontStyle }}>
                총 연습시간: <span style={{ color: "var(--MIMOSA)", fontWeight: 700 }}>{formatMinutesHuman(currentYearMinutes)}</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-primary)", ...commonFontStyle }}>
                연습한 날: <span style={{ color: "var(--MIMOSA)", fontWeight: 700 }}>{currentYearPracticeDays}일</span>
              </div>
              <TrendLineMiniChart
                values={yearTrendData}
                labels={["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]}
                accentColor="var(--TURQUOISE)"
                commonFontStyle={commonFontStyle}
              />
            </div>
          )}
        </div>
      </div>

      {showCalendarDetailModal && (
        <div
          onClick={() => {
            setShowCalendarDetailModal(false);
            setShowMonthYearPicker(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            background: "var(--modal-backdrop-home)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px"
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(560px, 100%)",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "var(--bg-primary)",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 8,
              boxShadow: "var(--shadow-medium)",
              padding: "18px 16px 20px",
              boxSizing: "border-box"
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", ...commonFontStyle }}>
                날짜별 기록
              </div>
              <button
                onClick={() => {
                  setShowCalendarDetailModal(false);
                  setShowMonthYearPicker(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  cursor: "pointer",
                  ...commonFontStyle
                }}
              >
                닫기
              </button>
            </div>

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
              koreanHolidays={koreanHolidays}
              commonFontStyle={commonFontStyle}
            />

            <div style={{
              marginTop: -5,
              padding: "0 16px 16px 16px",
              border: "1px solid rgba(0,0,0,0.12)",
              borderTop: "none",
              borderRadius: "0 0 5px 5px",
              background: "var(--bg-primary)",
              boxSizing: "border-box"
            }}>
              {selectedSessions.length > 0 ? selectedSessions.map((session, index) => (
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
              )) : (
                <div style={{
                  paddingTop: 16,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  ...commonFontStyle
                }}>
                  선택한 날짜의 세션 기록이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
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
