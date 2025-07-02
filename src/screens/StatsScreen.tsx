import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import Header from "../components/Header";

// 아이콘 imports
import LaurelLeftIcon from "../assets/icons/laurel_L.svg";
import LaurelRightIcon from "../assets/icons/laurel_R.svg";
import DoIcon from "../assets/icons/do.svg";
import HistoryIcon from "../assets/icons/History.svg";
import CalLeftIcon from "../assets/icons/cal_left.svg";
import CalRightIcon from "../assets/icons/cal_right.svg";
import CalDownIcon from "../assets/icons/cal_down.svg";

// 타입 정의
type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

type PracticeRecord = {
  date: string;
  practiceTime: number;
  track?: string;
  startTime?: number;
  endTime?: number;
};

type PracticeChecks = {
  [date: string]: { [trackId: number]: boolean };
};

interface SessionData {
  sessionNumber: number;
  duration: string;
  timeRange: string;
  minutes: number;
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
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());
  const [tracks, setTracks] = useState<Track[]>([]);
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>({});

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
        const parsed = JSON.parse(savedRecords);
        setPracticeRecords(Array.isArray(parsed) ? parsed : []);
      }

      const savedChecks = localStorage.getItem("practiceChecks");
      if (savedChecks) {
        setPracticeChecks(JSON.parse(savedChecks));
      }
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
  }, []);

  // 총 연습 시간 계산
  const totalMinutes = practiceRecords.reduce((sum, record) => sum + (record.practiceTime || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  // 선택된 날짜의 세션 데이터 생성
  const getSessionsForDate = (date: string): SessionData[] => {
    const dayRecords = practiceRecords.filter(r => r.date === date);
    return dayRecords.map((record, index) => {
      const hours = Math.floor(record.practiceTime / 60);
      const minutes = record.practiceTime % 60;
      const duration = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
      
      let timeRange = "시간 정보 없음";
      if (record.startTime && record.endTime) {
        const start = dayjs(record.startTime).format("HH:mm");
        const end = dayjs(record.endTime).format("HH:mm");
        timeRange = `${start}~${end}`;
      } else {
        const startHour = 9 + index * 2;
        const endHour = startHour + hours + (minutes > 30 ? 1 : 0);
        timeRange = `${startHour.toString().padStart(2, '0')}:${(index * 10).toString().padStart(2, '0')}~${endHour.toString().padStart(2, '0')}:${((index * 10) + minutes).toString().padStart(2, '0')}`;
      }
      
      return {
        sessionNumber: index + 1,
        duration,
        timeRange,
        minutes: record.practiceTime
      };
    });
  };

  // 선택된 날짜 기준 주간 데이터 계산
  const getWeekData = (selectedDate: string) => {
    const date = dayjs(selectedDate);
    const startOfWeek = date.startOf('week').add(1, 'day');
    const weekDates = Array.from({length: 7}, (_, i) => startOfWeek.add(i, 'day'));
    
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

  // 그래프 높이 계산
  const calculateBarHeight = (value: number, type: 'time' | 'songs') => {
    const MAX_HEIGHT = 70;
    const MIN_HEIGHT = 2;
    
    if (value === 0) return MIN_HEIGHT;
    
    const maxValue = type === 'time' ? 5 : 5;
    const ratio = value / maxValue;
    return Math.max(MIN_HEIGHT + 3, Math.min(ratio * MAX_HEIGHT, MAX_HEIGHT));
  };

  // 캘린더 날짜 생성
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

  return (
    <div style={{
      width: "100%",
      maxWidth: 375, // 최대 너비는 유지
      margin: "0 auto",
      background: "#ffffff",
      minHeight: "100vh",
      // 모바일에서도 최소 16px의 좌우 패딩을 보장
      padding: "0 clamp(16px, 4vw, 20px)",
      boxSizing: "border-box", // 패딩이 너비에 포함되도록 설정
      ...commonFontStyle
    }}>
      {/* Header */}
      <Header 
        title="statistics" 
        color="#F0C05A"
        topMargin={44}
        showBackButton={true}
      />

      {/* 총 연습 시간 */}
      <div style={{
        width: "100%", // 부모 너비에 맞춰 유동적
        height: 24,
        margin: "25px auto 0 auto", // 중앙 정렬 유지
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box" 
      }}>
        <img src={LaurelLeftIcon} alt="laurel left" width="13" height="20" />
        <div style={{
          fontSize: 16,
          color: "#2D2D2A",
          textAlign: "center",
          lineHeight: "24px",
          flex: 1 // 텍스트가 남은 공간을 채우도록
        }}>
          지금까지 총 <span style={{ fontWeight: 700, color: "#F0C05A" }}>{totalHours}</span>시간 피출
        </div>
        <img src={LaurelRightIcon} alt="laurel right" width="13" height="20" />
      </div>

      {/* 캘린더 */}
      <div style={{
        width: "100%", // 부모 너비에 맞춰 유동적
        margin: "25px auto 0 auto", // 중앙 정렬 유지
        padding: "16px 0", // 수평 패딩 제거, 수직 패딩만 유지 (부모의 clamp 패딩에 의존)
        border: "0.5px solid #9E9C98",
        borderRadius: 5,
        background: "#ffffff",
        boxSizing: "border-box" // 패딩이 너비에 포함되도록 설정
      }}>
        {/* 캘린더 헤더 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          padding: "0 16px" // 캘린더 헤더는 자체적으로 좌우 패딩을 가짐
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 16,
              color: "#9E9C98",
              ...commonFontStyle
            }}>
              {currentMonth.format("YYYY년 MM월")}
            </span>
            <img src={CalDownIcon} alt="dropdown" width="9" height="6" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <img src={CalLeftIcon} alt="previous" width="14" height="8" />
            </button>
            <button
              onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <img src={CalRightIcon} alt="next" width="14" height="8" />
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "min(6px, 1.5vw)", // 유동적인 갭 유지
          marginBottom: 8,
          padding: "0 16px" // 요일 헤더도 자체 좌우 패딩을 가짐
        }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <div
              key={index}
              style={{
                fontSize: 16,
                color: index === 5 ? "#6667AB" : index === 6 ? "#BB2649" : "#9E9C98",
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
              gap: "min(6px, 1.5vw)", // 유동적인 갭 유지
              marginBottom: 8,
              padding: "0 16px" // 캘린더 그리드도 자체 좌우 패딩을 가짐
            }}
          >
            {week.map((date, dayIndex) => {
              const dateStr = date.format("YYYY-MM-DD");
              const isCurrentMonth = date.month() === currentMonth.month();
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === today;
              const isSunday = date.day() === 0;
              const isHoliday = koreanHolidays.includes(dateStr);
              const isFuture = date.isAfter(dayjs(), 'day');
              
              const practiced = practiceRecords.some(r => r.date === dateStr) || 
                              (practiceChecks[dateStr] && Object.values(practiceChecks[dateStr]).some(Boolean));

              return (
                <div
                  key={dayIndex}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    aspectRatio: "1", // 정사각형 유지
                    minWidth: 0,      // flex 축소 허용
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: "pointer",
                    opacity: isCurrentMonth ? 1 : 0.3,
                    boxSizing: "border-box" // 여기에 boxSizing 추가 (아이콘/원 정렬)
                  }}
                >
                  {practiced && isCurrentMonth && (
                    <img
                      src={DoIcon}
                      alt="practiced"
                      style={{
                        width: "100%",     // 부모 너비에 맞춰 유동적
                        height: "100%",    // 부모 높이에 맞춰 유동적
                        maxWidth: 32,      // 최대 크기 제한
                        maxHeight: 32,
                        position: "absolute",
                        top: '50%',        // ✅ 중앙 정렬을 위해 50%로 변경
                        left: '50%',       // ✅ 중앙 정렬을 위해 50%로 변경
                        transform: 'translate(-50%, -50%)', // ✅ 중앙 정렬을 위해 추가
                        zIndex: 1
                      }}
                    />
                  )}
                  
                  <span style={{
                    fontSize: "clamp(12px, 4vw, 16px)", // 반응형 폰트
                    color: dayIndex === 6 || isHoliday ? "#BB2649" : "#2D2D2A",
                    textDecoration: !practiced && isCurrentMonth && !isFuture ? "line-through" : "none",
                    zIndex: 2,
                    position: "relative",
                    border: isSelected ? "1px solid #BB2649" : "none",
                    borderRadius: isSelected ? "50%" : "0", // 50px에서 50%로 변경 (정원)
                    width: isSelected ? "100%" : "auto",  // 부모 너비에 맞춰 유동적
                    height: isSelected ? "100%" : "auto", // 부모 높이에 맞춰 유동적
                    maxWidth: isSelected ? 32 : "auto",   // 최대 크기 제한
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
          <div style={{ marginTop: 16, padding: "0 16px" }}> {/* 세션 카드 컨테이너도 자체 좌우 패딩을 가짐 */}
            {selectedSessions.map((session, index) => (
              <div
                key={index}
                style={{
                  width: "100%", // 부모 너비에 맞춰 유동적
                  height: 32,
                  margin: index === 0 ? "0 auto" : "10px auto 0 auto", // 중앙 정렬 유지
                  padding: "6px 10px",
                  border: "0.5px solid #F0EAD6",
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#ffffff",
                  boxSizing: "border-box" // 패딩이 너비에 포함되도록 설정
                }}
              >
                <img src={HistoryIcon} alt="history" width="16" height="16" />
                <div style={{
                  fontSize: 14,
                  color: "#2D2D2A",
                  flex: 1, // 텍스트가 남은 공간 채우도록
                  overflow: "hidden",
                  ...commonFontStyle
                }}>
                  <span style={{ fontSize: 12, color: "#9E9C98" }}>
                    Session {session.sessionNumber}.
                  </span>{" "}
                  {session.duration} ({session.timeRange})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 주간 차트 - 레이아웃 핵심 수정 */}
      <div style={{
        display: "flex",
        gap: "min(12px, 3vw)", // 부모의 유동적인 갭 유지
        margin: "10px auto 0 auto", // 중앙 정렬 유지
        width: "100%", // 부모 너비는 100%
        boxSizing: "border-box", 
        justifyContent: "space-between", // 아이템들을 양 끝으로 벌림
        alignItems: "flex-start"
      }}>
        {/* 주간 피출 시간 */}
        <div style={{
          flex: 1, // 남은 공간을 균등하게 채움
          minWidth: "calc(50% - min(12px, 3vw) / 2)", // 각 박스의 최소 너비 설정 (유동적인 갭 반영)
          height: 161,
          padding: 10,
          border: "0.5px solid #9E9C98",
          borderRadius: 5,
          background: "#ffffff",
          boxSizing: "border-box"
        }}>
          <div style={{
            fontSize: 12,
            color: "#2D2D2A",
            marginBottom: 4,
            ...commonFontStyle
          }}>
            주간 피출 시간
          </div>
          <div style={{
            fontSize: 12,
            color: "#2D2D2A",
            marginBottom: 12,
            ...commonFontStyle
          }}>
            {weekData.dateRange}
          </div>
          
          <div style={{
            display: "flex",
            height: 70,
            marginBottom: 8
          }}>
            {/* 사이드 눈금 */}
            <div style={{
              width: 20,
              height: 70,
              position: "relative",
              marginRight: 5,
              flexShrink: 0
            }}>
              {[5, 4, 3, 2, 1, 0].map((hour, index) => (
                <div key={hour} style={{
                  position: "absolute",
                  top: index * 14,
                  right: 0,
                  fontSize: 10,
                  color: "#9E9C98",
                  lineHeight: "8px",
                  fontWeight: "normal",
                  ...commonFontStyle
                }}>
                  {hour}h
                </div>
              ))}
            </div>
            
            {/* 그래프 막대들 */}
            <div style={{
              display: "flex",
              alignItems: "end",
              height: 70,
              flex: 1, // 남은 공간을 채우도록
              minWidth: 0 // 축소 허용
            }}>
              {weekData.timeData.map((value, index) => {
                const isToday = weekData.dates[index].format("YYYY-MM-DD") === today;
                const height = calculateBarHeight(value, 'time');
                
                return (
                  <div
                    key={index}
                    style={{
                      flex: "1 1 0",
                      height: height,
                      backgroundColor: isToday ? "#F0C05A" : "#F0EAD6",
                      borderRadius: 2,
                      marginRight: index < 6 ? 2 : 0,
                      minWidth: 0 // 축소 허용
                    }}
                  />
                );
              })}
            </div>
          </div>
          
          {/* 요일 라벨 */}
          <div style={{
            display: "flex",
            fontSize: 12,
            ...commonFontStyle
          }}>
            <div style={{ width: 25, flexShrink: 0 }} />
            <div style={{
              display: "flex",
              flex: 1,
              minWidth: 0 // 축소 허용
            }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div
                  key={index}
                  style={{
                    flex: "1 1 0",
                    textAlign: "center",
                    color: index === 5 ? "#6667AB" : index === 6 ? "#BB2649" : "#9E9C98",
                    marginRight: index < 6 ? 2 : 0,
                    minWidth: 0 // 축소 허용
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 주간 연습 곡 */}
        <div style={{
          flex: 1, // 남은 공간을 균등하게 채움
          minWidth: "calc(50% - min(12px, 3vw) / 2)", // 각 박스의 최소 너비 설정
          height: 161,
          padding: 10,
          border: "0.5px solid #9E9C98",
          borderRadius: 5,
          background: "#ffffff",
          boxSizing: "border-box"
        }}>
          <div style={{
            fontSize: 12,
            color: "#2D2D2A",
            marginBottom: 4,
            ...commonFontStyle
          }}>
            주간 연습 곡
          </div>
          <div style={{
            fontSize: 12,
            color: "#2D2D2A",
            marginBottom: 12,
            ...commonFontStyle
          }}>
            {weekData.dateRange}
          </div>
          
          <div style={{
            display: "flex",
            height: 70,
            marginBottom: 8
          }}>
            {/* 사이드 눈금 */}
            <div style={{
              width: 20,
              height: 70,
              position: "relative",
              marginRight: 5,
              flexShrink: 0
            }}>
              {[5, 4, 3, 2, 1, 0].map((songs, index) => (
                <div key={songs} style={{
                  position: "absolute",
                  top: index * 14,
                  right: 0,
                  fontSize: 10,
                  color: "#9E9C98",
                  lineHeight: "8px",
                  fontWeight: "normal",
                  ...commonFontStyle
                }}>
                  {songs}
                </div>
              ))}
            </div>
            
            {/* 그래프 막대들 */}
            <div style={{
              display: "flex",
              alignItems: "end",
              height: 70,
              flex: 1, // 남은 공간을 채우도록
              minWidth: 0 // 축소 허용
            }}>
              {weekData.songData.map((value, index) => {
                const isToday = weekData.dates[index].format("YYYY-MM-DD") === today;
                const height = calculateBarHeight(value, 'songs');
                
                return (
                  <div
                    key={index}
                    style={{
                      flex: "1 1 0",
                      height: height,
                      backgroundColor: isToday ? "#F0C05A" : "#F0EAD6",
                      borderRadius: 2,
                      marginRight: index < 6 ? 2 : 0,
                      minWidth: 0 // 축소 허용
                    }}
                  />
                );
              })}
            </div>
          </div>
          
          {/* 요일 라벨 */}
          <div style={{
            display: "flex",
            fontSize: 12,
            ...commonFontStyle
          }}>
            <div style={{ width: 25, flexShrink: 0 }} />
            <div style={{
              display: "flex",
              flex: 1,
              minWidth: 0 // 축소 허용
            }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div
                  key={index}
                  style={{
                    flex: "1 1 0",
                    textAlign: "center",
                    color: index === 5 ? "#6667AB" : index === 6 ? "#BB2649" : "#9E9C98",
                    marginRight: index < 6 ? 2 : 0,
                    minWidth: 0 // 축소 허용
                  }}
                >
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