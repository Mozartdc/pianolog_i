import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import Header from "../components/Header";

// 아이콘 imports (✅ ?react 추가)
import LaurelLeftIcon from "../assets/icons/laurel_L.svg?react";
import LaurelRightIcon from "../assets/icons/laurel_R.svg?react";
import DoIcon from "../assets/icons/do.svg?react";
import HistoryIcon from "../assets/icons/History.svg?react";
import CalLeftIcon from "../assets/icons/cal_left.svg?react";
import CalRightIcon from "../assets/icons/cal_right.svg?react";
import CalDownIcon from "../assets/icons/cal_down.svg?react";
import StatsDayDetailModal from "./StatsDayDetailScreen"; // 

// 타입 정의
type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

type PracticeRecord = {
  id: string;
  date: string;
  practiceTime: number;
  startTime: number;
  endTime: number;
  memo?: string;
  tracks?: string[];
};

type PracticeChecks = {
  [date: string]: { [trackId: number]: boolean };
};

interface SessionData {
  id: string;
  sessionNumber: number;
  duration: string;
  timeRange: string;
  minutes: number;
  memo?: string;
}

// 한국 공휴일 계산 함수
const getKoreanHolidays = (year: number): string[] => {
  const holidays = [
    `${year}-01-01`, `${year}-03-01`, `${year}-05-05`, `${year}-06-06`,
    `${year}-08-15`, `${year}-10-03`, `${year}-10-09`, `${year}-12-25`,
  ];
  if (year === 2025) {
    holidays.push(
      '2025-01-28', '2025-01-29', '2025-01-30',
      '2025-05-13', '2025-09-06', '2025-09-07', '2025-09-08'
    );
  }
  return holidays;
};

function StatsScreen() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());
  const [tracks, setTracks] = useState<Track[]>([]);
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>({});
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  // 데이터 로딩
  useEffect(() => {
    try {
      const savedTracks = localStorage.getItem("tracks");
      if (savedTracks) {
        setTracks(JSON.parse(savedTracks));
      }

      const savedRecords = localStorage.getItem("practiceRecords");
      if (savedRecords) {
        let parsedRecords = JSON.parse(savedRecords);
        let needsSave = false;

        if (!Array.isArray(parsedRecords)) {
          parsedRecords = [parsedRecords];
        }

        const recordsWithIds: PracticeRecord[] = parsedRecords.map((record: any) => {
          if (!record.id) {
            needsSave = true;
            return {
              ...record,
              id: dayjs(record.startTime || record.date).valueOf().toString() + Math.random().toString(36).substring(2, 8),
              startTime: record.startTime || 0,
              endTime: record.endTime || 0,
              memo: record.memo || '',
              tracks: record.tracks || []
            };
          }
          return {
            ...record,
            startTime: record.startTime || 0,
            endTime: record.endTime || 0,
            memo: record.memo || '',
            tracks: record.tracks || []
          };
        });
        setPracticeRecords(recordsWithIds);

        if (needsSave) {
          localStorage.setItem("practiceRecords", JSON.stringify(recordsWithIds));
        }
      }

      const savedChecks = localStorage.getItem("practiceChecks");
      if (savedChecks) {
        setPracticeChecks(JSON.parse(savedChecks));
      }
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
  }, []);

  const totalMinutes = practiceRecords.reduce((sum, record) => sum + (record.practiceTime || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  const getSessionsForDate = (date: string): SessionData[] => {
    const dayRecords = practiceRecords.filter(r => r.date === date);
    dayRecords.sort((a, b) => a.startTime - b.startTime);

    return dayRecords.map((record, index) => {
      const hours = Math.floor(record.practiceTime / 60);
      const minutes = record.practiceTime % 60;
      const duration = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;

      const start = dayjs(record.startTime).format("HH:mm");
      const end = dayjs(record.endTime).format("HH:mm");
      const timeRange = `${start}~${end}`;

      return {
        id: record.id,
        sessionNumber: index + 1,
        duration,
        timeRange,
        minutes: record.practiceTime,
        memo: record.memo
      };
    });
  };

  const handleSessionClick = (sessionId: string) => {
    setExpandedSessionId(prevId => (prevId === sessionId ? null : sessionId));
  };

  const getWeekData = (selectedDate: string) => {
    const date = dayjs(selectedDate);
    const startOfWeek = date.startOf('week').add(1, 'day');
    const weekDates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

    const timeData = weekDates.map(d => {
      const dateStr = d.format("YYYY-MM-DD");
      const dayRecords = practiceRecords.filter(r => r.date === dateStr);
      return dayRecords.reduce((sum, r) => sum + (r.practiceTime || 0), 0) / 60;
    });

    const songData = weekDates.map(d => {
      const dateStr = d.format("YYYY-MM-DD");
      const checks = practiceChecks[dateStr];
      return checks ? Object.values(checks).filter(Boolean).length : 0;
    });

    return {
      dates: weekDates,
      timeData,
      songData,
      dateRange: `${startOfWeek.format("MMM DD")} - ${startOfWeek.add(6, 'day').format("MMM DD")}`
    };
  };

const getDynamicMaxAndTicks = (data: number[], type: 'time' | 'songs') => {
    const actualMax = Math.max(...data, 0);
    let displayMax;
    const tickCount = 5;

    if (actualMax === 0) {
      displayMax = 5;
    } else if (actualMax <= 5) {
      displayMax = 5;
    } else {
      displayMax = Math.ceil(actualMax / 5) * 5;
    }

    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(displayMax - (i * (displayMax / tickCount)));
    }

    const formattedTicks = ticks.map(tick => {
      if (type === 'time') return parseFloat(tick.toFixed(1));
      return Math.round(tick);
    });

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
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startOfWeek = startOfMonth.startOf('week').add(1, 'day');
    const endOfWeek = endOfMonth.endOf('week').add(1, 'day');

    const days = [];
    let current = startOfWeek;
    while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
      days.push(current);
      current = current.add(1, 'day');
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weeks = [];
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

  return (
    <div style={{
      width: "100%",
      maxWidth: "100%",
      margin: "0 auto",
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      minHeight: "100vh",
      padding: "0 clamp(16px, 4vw, 20px)",
      boxSizing: "border-box",
      ...commonFontStyle
    }}>
      {/* Header */}
      <Header
        title="statistics"
        color="var(--MIMOSA)"
        topMargin={44}
        showBackButton={true}
      />

      {/* 총 연습 시간 */}
      <div style={{
        width: "100%",
        height: 24,
        margin: "25px auto 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box"
      }}>
        <LaurelLeftIcon style={{ color: "var(--MIMOSA)" }} width="13" height="20" />
        <div style={{
          fontSize: 16,
          textAlign: "center",
          lineHeight: "24px",
          flex: 1
        }}>
          지금까지 총 <span style={{ fontWeight: 700, color: "var(--MIMOSA)" }}>{totalHours}</span>시간 피출
        </div>
        <LaurelRightIcon style={{ color: "var(--MIMOSA)" }} width="13" height="20" />
      </div>

      {/* 캘린더 */}
      <div style={{
        width: "100%",
        margin: "25px auto 0 auto",
        padding: "16px 0",
        border: "var(--border-light)",
        borderRadius: 5,
        background: "var(--bg-primary)",
        boxSizing: "border-box"
      }}>
        {/* 캘린더 헤더 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          padding: "0 16px",
          position: 'relative'
        }}>
          <button
            onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text-secondary)", background: "none", border: "none" }}
          >
            <span style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              ...commonFontStyle
            }}>
              {currentMonth.format("YYYY년 MM월")}
            </span>
            <CalDownIcon
              width="9"
              height="6"
              style={{
                transform: showMonthYearPicker ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
          </button>
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

        {/* 월/년 선택기 UI */}
      {showMonthYearPicker && (
        <div style={{
          // --- 위치 및 크기 ---
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          marginTop: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
          
          // --- 배경 및 테두리 ---
          background: 'var(--bg-secondary)',
          border: 'var(--border-light)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-light)',
          zIndex: 100,

          // ✅ [추가] 내부 콘텐츠 정렬을 위한 스타일
          display: 'flex',
          flexDirection: 'column'
        }}>
          {Array.from({ length: 10 }, (_, i) => {
            const year = dayjs().year() - 5 + i;
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
                  flexShrink: 0 // 아이템이 줄어들지 않도록 추가
                }}
              >
                {year}년
              </div>
            );
          })}
        </div>
      )}

        {/* 요일 헤더 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "min(6px, 1.5vw)",
          marginBottom: 8,
          padding: "0 16px"
        }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <div
              key={index}
              style={{
                fontSize: 16,
                color: index === 5 ? "var(--VERY_PERI)" : index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)",
                textAlign: "center",
                ...commonFontStyle
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "min(6px, 1.5vw)",
              marginBottom: 8,
              padding: "0 16px"
            }}
          >
            {week.map((date, dayIndex) => {
              const dateStr = date.format("YYYY-MM-DD");
              const isCurrentMonth = date.month() === currentMonth.month();
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === today;
              const isHoliday = koreanHolidays.includes(dateStr);
              const isFuture = date.isAfter(dayjs(), 'day');

              const practiced = practiceRecords.some(r => r.date === dateStr) ||
                (practiceChecks[dateStr] && Object.values(practiceChecks[dateStr]).some(Boolean));

              return (
                <div
                  key={dayIndex}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setExpandedSessionId(null);
                    setShowMonthYearPicker(false);
                    setShowDetailModal(true);
                  }}
                  style={{
                    aspectRatio: "1",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: "pointer",
                    opacity: isCurrentMonth ? 1 : 0.3,
                    boxSizing: "border-box"
                  }}
                >
                  {practiced && isCurrentMonth && (
                    <DoIcon
                      style={{
                        color: "var(--MIMOSA)",
                        width: "100%", height: "100%", maxWidth: 32, maxHeight: 32,
                        position: "absolute", top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)', zIndex: 1
                      }}
                    />
                  )}

                  <span style={{
                    fontSize: "clamp(12px, 4vw, 16px)",
                    color: dayIndex === 6 || isHoliday ? "var(--VIVA_MAGENTA)" : "var(--text-primary)",
                    textDecoration: !practiced && isCurrentMonth && !isFuture ? "line-through" : "none",
                    zIndex: 2,
                    position: "relative",
                    border: isSelected ? "1px solid var(--VIVA_MAGENTA)" : "none",
                    borderRadius: isSelected ? "50%" : "0",
                    width: isSelected ? "100%" : "auto",
                    height: isSelected ? "100%" : "auto",
                    maxWidth: isSelected ? 32 : "auto",
                    maxHeight: isSelected ? 32 : "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...commonFontStyle
                  }}>
                    {date.date()}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        {/* 세션 카드들 */}
        {selectedSessions.length > 0 && (
          <div style={{ marginTop: 16, padding: "0 16px" }}>
            {selectedSessions.map((session, index) => {
              const isExpanded = expandedSessionId === session.id;
              return (
                <React.Fragment key={session.id}>
                  <div
                    onClick={() => handleSessionClick(session.id)}
                    style={{
                      width: "100%", height: 32,
                      margin: index === 0 ? "0 auto" : "10px auto 0 auto",
                      padding: "6px 10px",
                      border: "0.5px solid var(--MIMOSA)", // ✅ 변수로 변경
                      borderRadius: 5,
                      display: "flex", alignItems: "center", gap: 8,
                      background: "var(--bg-primary)",
                      boxSizing: "border-box", cursor: "pointer", position: 'relative',
                      color: "var(--MIMOSA)", // 아이콘 색상 상속
                    }}
                  >
                    <HistoryIcon width="16" height="16" />
                    <div style={{
                      fontSize: 14,
                      color: "var(--text-primary)",
                      flex: 1, overflow: "hidden", ...commonFontStyle
                    }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        session {session.sessionNumber}.
                      </span>{" "}
                      {session.duration} ({session.timeRange})
                    </div>
                    <CalDownIcon
                      width="9"
                      height="6"
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        position: 'absolute', right: '10px'
                      }}
                    />
                  </div>
                  {isExpanded && (
                      <div style={{
                          width: "100%", padding: "10px 15px",
                          background: "var(--info-bg)",
                          border: "var(--border-light)",
                          borderRadius: 5, marginTop: 5, marginBottom: 5,
                          boxSizing: "border-box", fontSize: 13,
                          color: "var(--text-secondary)",
                          ...commonFontStyle
                      }}>
                          메모: {session.memo || "작성된 메모가 없습니다."}
                      </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* 주간 차트 */}
      <div style={{
        display: "flex", gap: "min(12px, 3vw)",
        margin: "10px auto 0 auto", width: "100%",
        boxSizing: "border-box", justifyContent: "space-between", alignItems: "flex-start"
      }}>
        {/* 주간 피출 시간 */}
        <div style={{
          flex: 1, minWidth: "calc(50% - min(12px, 3vw) / 2)",
          height: 161, padding: 10,
          border: "var(--border-light)",
          borderRadius: 5,
          background: "var(--bg-primary)",
          boxSizing: "border-box"
        }}>
          <div style={{
            fontSize: 12,
            color: "var(--text-primary)",
            marginBottom: 4, ...commonFontStyle
          }}>
            주간 피출 시간
          </div>
          <div style={{
            fontSize: 12,
            color: "var(--text-primary)",
            marginBottom: 12, ...commonFontStyle
          }}>
            {weekData.dateRange}
          </div>
          <div style={{ display: "flex", height: 70, marginBottom: 8 }}>
            <div style={{
              width: 25, height: 70, position: "relative",
              marginRight: 5, flexShrink: 0
            }}>
              {timeTicks.map((hour, index) => (
                <div key={index} style={{
                  position: "absolute", top: `${index * (100 / (timeTicks.length - 1))}%`, transform: 'translateY(-50%)', left: 0,
                  fontSize: 10, color: "var(--text-secondary)",
                  lineHeight: 1, fontWeight: "normal", ...commonFontStyle
                }}>
                  {hour}h
                </div>
              ))}
            </div>
            <div style={{
              display: "flex", alignItems: "end", height: 70,
              flex: 1, minWidth: 0
            }}>
              {weekData.timeData.map((value, index) => {
                const isToday = weekData.dates[index].format("YYYY-MM-DD") === today;
                const height = calculateBarHeight(value, timeMaxValue);
                return (
                  <div key={index} style={{
                    flex: "1 1 0", height: height,
                    backgroundColor: isToday ? "var(--MIMOSA)" : "var(--bg-secondary)", // ✅ 변수로 변경
                    borderRadius: 2, marginRight: index < 6 ? 2 : 0, minWidth: 0
                  }} />
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 12, ...commonFontStyle }}>
            <div style={{ width: 30, flexShrink: 0 }} />
            <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div key={index} style={{
                  flex: "1 1 0", textAlign: "center",
                  color: index === 5 ? "var(--VERY_PERI)" : index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)",
                  marginRight: index < 6 ? 2 : 0, minWidth: 0
                }}>
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 주간 연습 곡 */}
        <div style={{
          flex: 1, minWidth: "calc(50% - min(12px, 3vw) / 2)",
          height: 161, padding: 10,
          border: "var(--border-light)",
          borderRadius: 5,
          background: "var(--bg-primary)",
          boxSizing: "border-box"
        }}>
          <div style={{
            fontSize: 12,
            color: "var(--text-primary)",
            marginBottom: 4, ...commonFontStyle
          }}>
            주간 연습 곡
          </div>
          <div style={{
            fontSize: 12,
            color: "var(--text-primary)",
            marginBottom: 12, ...commonFontStyle
          }}>
            {weekData.dateRange}
          </div>
          <div style={{ display: "flex", height: 70, marginBottom: 8 }}>
            <div style={{
              width: 25, height: 70, position: "relative",
              marginRight: 5, flexShrink: 0
            }}>
              {songTicks.map((songs, index) => (
                <div key={index} style={{
                  position: "absolute", top: `${index * (100 / (songTicks.length - 1))}%`, transform: 'translateY(-50%)', left: 0,
                  fontSize: 10, color: "var(--text-secondary)",
                  lineHeight: 1, fontWeight: "normal", ...commonFontStyle
                }}>
                  {songs}
                </div>
              ))}
            </div>
            <div style={{
              display: "flex", alignItems: "end",
              height: 70, flex: 1, minWidth: 0
            }}>
              {weekData.songData.map((value, index) => {
                const isToday = weekData.dates[index].format("YYYY-MM-DD") === today;
                const height = calculateBarHeight(value, songMaxValue);
                return (
                  <div key={index} style={{
                    flex: "1 1 0", height: height,
                    backgroundColor: isToday ? "var(--MIMOSA)" : "var(--bg-secondary)", // ✅ 변수로 변경
                    borderRadius: 2, marginRight: index < 6 ? 2 : 0, minWidth: 0
                  }} />
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 12, ...commonFontStyle }}>
            <div style={{ width: 30, flexShrink: 0 }} />
            <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div key={index} style={{
                  flex: "1 1 0", textAlign: "center",
                  color: index === 5 ? "var(--VERY_PERI)" : index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)",
                  marginRight: index < 6 ? 2 : 0, minWidth: 0
                }}>
                  {day}
                </div>
              ))}
              <StatsDayDetailModal 
      isOpen={showDetailModal}
      onClose={() => setShowDetailModal(false)}
      date={selectedDate}
    />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsScreen;
