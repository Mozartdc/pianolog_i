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
import CalDownIcon from "../assets/icons/cal_down.svg"; // 사용자가 제공한 드롭다운 아이콘

// 타입 정의
type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

// PracticeRecord 타입 업데이트: memo, tracks 필드 추가 (데이터에 있다면 활용)
type PracticeRecord = {
  id: string;           // 새로 추가된 고유 ID (문자열)
  date: string;
  practiceTime: number; // 분 단위
  startTime: number;    // 타임스탬프
  endTime: number;      // 타임스탬프
  memo?: string;        // ✅ 추가: 메모 필드 (데이터에 있다면 활용)
  tracks?: string[];    // ✅ 추가: 트랙 목록 필드 (데이터에 있다면 활용)
};

type PracticeChecks = {
  [date: string]: { [trackId: number]: boolean };
};

interface SessionData {
  id: string; // ✅ 추가: 세션 고유 ID
  sessionNumber: number;
  duration: string;
  timeRange: string;
  minutes: number;
  memo?: string; // ✅ 추가: 세션 데이터에도 메모 추가
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
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null); // ✅ 추가: 확장된 세션 ID
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false); // ✅ 추가: 월/년 선택기 표시 여부

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
        let needsSave = false; // 변경사항이 있어서 localStorage에 저장해야 하는지 여부

        // 단일 객체인 경우 (이전 버전 호환)
        if (!Array.isArray(parsedRecords)) { 
          parsedRecords = [parsedRecords];
        }

        const recordsWithIds: PracticeRecord[] = parsedRecords.map((record: any) => {
          if (!record.id) { // id가 없는 경우에만 새로 생성
            needsSave = true; 
            return {
              ...record,
              id: dayjs(record.startTime || record.date).valueOf().toString() + Math.random().toString(36).substring(2, 8),
              startTime: record.startTime || 0, 
              endTime: record.endTime || 0,
              memo: record.memo || '', // ✅ 기존 데이터에 memo가 없으면 빈 문자열
              tracks: record.tracks || [] // ✅ 기존 데이터에 tracks가 없으면 빈 배열
            };
          }
          return { // id가 있는 경우는 기존 값 유지 및 기본값 설정
            ...record,
            startTime: record.startTime || 0, 
            endTime: record.endTime || 0,
            memo: record.memo || '', 
            tracks: record.tracks || []
          };
        });
        setPracticeRecords(recordsWithIds);
        
        // id가 새로 생성된 경우에만 localStorage에 저장
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

  // 총 연습 시간 계산
  const totalMinutes = practiceRecords.reduce((sum, record) => sum + (record.practiceTime || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  // ✅ 선택된 날짜의 세션 데이터 생성 (정확한 시간 표시)
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
        id: record.id, // ✅ record.id 사용
        sessionNumber: index + 1,
        duration,
        timeRange,
        minutes: record.practiceTime,
        memo: record.memo // ✅ memo 전달
      };
    });
  };

  // ✅ 세션 클릭 시 확장/축소 토글 함수
  const handleSessionClick = (sessionId: string) => {
    setExpandedSessionId(prevId => (prevId === sessionId ? null : sessionId));
  };

  // 주간 데이터 계산
  const getWeekData = (selectedDate: string) => {
    const date = dayjs(selectedDate);
    const startOfWeek = date.startOf('week').add(1, 'day'); // 월요일 시작으로 조정
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

  // ✅ 동적 최대값 및 눈금 생성 함수
  const getDynamicMaxAndTicks = (data: number[], type: 'time' | 'songs') => {
    const actualMax = Math.max(...data, 0); 
    let displayMax; 
    const tickCount = 5; // 0 포함 6개의 눈금 레이블

    if (actualMax === 0) {
      displayMax = 5; // 데이터가 없을 때 기본 최대값
    } else if (actualMax <= 5) {
      displayMax = 5; // 5 이하일 때도 최대값 5 유지 (눈금 간격 1)
    } else {
      // 5를 초과하는 경우, 5 단위로 올림하여 최대값 설정
      displayMax = Math.ceil(actualMax / 5) * 5; 
    }
    
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(displayMax - (i * (displayMax / tickCount)));
    }
    
    const formattedTicks = ticks.map(tick => {
      if (type === 'time') return parseFloat(tick.toFixed(1)); // 시간은 소수점 첫째 자리까지
      return Math.round(tick); // 곡수는 정수
    });

    return { maxValue: displayMax, ticks: formattedTicks };
  };


  // 그래프 높이 계산 (maxValue는 이제 getDynamicMaxAndTicks에서 받아옴)
  const calculateBarHeight = (value: number, maxValue: number) => {
    const MAX_HEIGHT = 70;
    const MIN_HEIGHT = 2; // 최소 막대 높이

    if (maxValue === 0 || value === 0) return MIN_HEIGHT; // maxValue가 0이거나 value가 0이면 최소 높이

    const ratio = value / maxValue;
    return Math.max(MIN_HEIGHT, Math.min(ratio * MAX_HEIGHT, MAX_HEIGHT));
  };


  // 캘린더 날짜 생성
  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startOfWeek = startOfMonth.startOf('week').add(1, 'day'); // 월요일 시작
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


  return (
    <div style={{
      width: "100%",
      maxWidth: "100%",
      margin: "0 auto",
      background: "#ffffff",
      minHeight: "100vh",
      padding: "0 clamp(16px, 4vw, 20px)",
      boxSizing: "border-box",
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
        width: "100%",
        height: 24,
        margin: "25px auto 0 auto",
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
          flex: 1
        }}>
          지금까지 총 <span style={{ fontWeight: 700, color: "#F0C05A" }}>{totalHours}</span>시간 피출
        </div>
        <img src={LaurelRightIcon} alt="laurel right" width="13" height="20" />
      </div>

      {/* 캘린더 */}
      <div style={{
        width: "100%",
        margin: "25px auto 0 auto",
        padding: "16px 0",
        border: "0.5px solid #9E9C98",
        borderRadius: 5,
        background: "#ffffff",
        boxSizing: "border-box"
      }}>
        {/* 캘린더 헤더 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          padding: "0 16px"
        }}>
          {/* ✅ 월/년 선택기 토글 버튼 */}
          <div 
            onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            <span style={{
              fontSize: 16,
              color: "#9E9C98",
              ...commonFontStyle
            }}>
              {currentMonth.format("YYYY년 MM월")}
            </span>
            <img 
              src={CalDownIcon} 
              alt="dropdown" 
              width="9" 
              height="6"
              style={{ transform: showMonthYearPicker ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setCurrentMonth(currentMonth.subtract(1, 'month'));
                setShowMonthYearPicker(false); // 월 변경 시 선택기 닫기
              }}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <img src={CalLeftIcon} alt="previous" width="14" height="8" />
            </button>
            <button
              onClick={() => {
                setCurrentMonth(currentMonth.add(1, 'month'));
                setShowMonthYearPicker(false); // 월 변경 시 선택기 닫기
              }}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <img src={CalRightIcon} alt="next" width="14" height="8" />
            </button>
          </div>
        </div>

        {/* ✅ 월/년 선택기 UI (간단한 예시) */}
        {showMonthYearPicker && (
          <div style={{ 
            position: 'absolute', // 캘린더 위에 띄우기
            top: '50%', // 적절한 위치로 조정 필요
            left: '50%', // 적절한 위치로 조정 필요
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '200px',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            zIndex: 100, // 다른 요소 위에 오도록
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* ✅ Typography 대신 div와 span 사용 */}
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#2D2D2A', ...commonFontStyle }}>월/년 선택기</div>
            <div style={{ fontSize: 14, color: '#555', ...commonFontStyle }}>여기에 년도와 월을 선택하는 UI가 들어갈 예정입니다.</div>
            <button onClick={() => setShowMonthYearPicker(false)} style={{ padding: '8px 16px', background: '#45b5aa', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>닫기</button>
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
                    setExpandedSessionId(null); // 날짜 변경 시 확장된 세션 초기화
                    setShowMonthYearPicker(false); // 날짜 클릭 시 월/년 선택기 닫기
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
                    <img
                      src={DoIcon}
                      alt="practiced"
                      style={{
                        width: "100%",
                        height: "100%",
                        maxWidth: 32,
                        maxHeight: 32,
                        position: "absolute",
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1
                      }}
                    />
                  )}
                  
                  <span style={{
                    fontSize: "clamp(12px, 4vw, 16px)",
                    color: dayIndex === 6 || isHoliday ? "#BB2649" : "#2D2D2A",
                    textDecoration: !practiced && isCurrentMonth && !isFuture ? "line-through" : "none",
                    zIndex: 2,
                    position: "relative",
                    border: isSelected ? "1px solid #BB2649" : "none",
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
                      width: "100%",
                      height: 32,
                      margin: index === 0 ? "0 auto" : "10px auto 0 auto",
                      padding: "6px 10px",
                      border: "0.5px solid #F0EAD6",
                      borderRadius: 5,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#ffffff",
                      boxSizing: "border-box",
                      cursor: "pointer",
                      position: 'relative'
                    }}
                  >
                    <img src={HistoryIcon} alt="history" width="16" height="16" />
                    <div style={{
                      fontSize: 14,
                      color: "#2D2D2A",
                      flex: 1,
                      overflow: "hidden",
                      ...commonFontStyle
                    }}>
                      <span style={{ fontSize: 12, color: "#9E9C98" }}>
                        session {session.sessionNumber}.
                      </span>{" "}
                      {session.duration} ({session.timeRange})
                    </div>
                    <img 
                      src={CalDownIcon} 
                      alt="toggle" 
                      width="9" 
                      height="6" 
                      style={{ 
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.2s',
                        position: 'absolute',
                        right: '10px'
                      }} 
                    />
                  </div>
                  {isExpanded && session.memo && (
                    <div style={{
                      width: "100%",
                      padding: "10px 15px",
                      background: "#f9f9f9",
                      border: "0.5px solid #eee",
                      borderRadius: 5,
                      marginTop: 5,
                      marginBottom: 5,
                      boxSizing: "border-box",
                      fontSize: 13,
                      color: "#555",
                      ...commonFontStyle
                    }}>
                      메모: {session.memo}
                    </div>
                  )}
                  {isExpanded && !session.memo && (
                      <div style={{
                          width: "100%",
                          padding: "10px 15px",
                          background: "#f9f9f9",
                          border: "0.5px solid #eee",
                          borderRadius: 5,
                          marginTop: 5,
                          marginBottom: 5,
                          boxSizing: "border-box",
                          fontSize: 13,
                          color: "#555",
                          ...commonFontStyle
                      }}>
                          메모: 작성된 메모가 없습니다.
                      </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* 주간 차트 - 레이아웃 핵심 수정 */}
      <div style={{
        display: "flex",
        gap: "min(12px, 3vw)",
        margin: "10px auto 0 auto",
        width: "100%",
        boxSizing: "border-box", 
        justifyContent: "space-between",
        alignItems: "flex-start"
      }}>
        {/* 주간 피출 시간 */}
        <div style={{
          flex: 1,
          minWidth: "calc(50% - min(12px, 3vw) / 2)",
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
              width: 25, // 눈금 레이블 너비 조정
              height: 70,
              position: "relative",
              marginRight: 5,
              flexShrink: 0
            }}>
              {timeTicks.map((hour, index) => (
                <div key={index} style={{ // key를 index로 변경 (tick 값이 중복될 수 있으므로)
                  position: "absolute",
                  top: index * (70 / (timeTicks.length -1)), // 눈금 간격 조정
                  left: 0, // 왼쪽 정렬로 변경
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
              flex: 1,
              minWidth: 0
            }}>
              {weekData.timeData.map((value, index) => {
                const isToday = weekData.dates[index].format("YYYY-MM-DD") === today;
                const height = calculateBarHeight(value, timeMaxValue);
                
                return (
                  <div
                    key={index}
                    style={{
                      flex: "1 1 0",
                      height: height,
                      backgroundColor: isToday ? "#F0C05A" : "#F0EAD6",
                      borderRadius: 2,
                      marginRight: index < 6 ? 2 : 0,
                      minWidth: 0
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
            <div style={{ width: 30, flexShrink: 0 }} /> {/* 눈금 레이블 너비만큼 공간 확보 */}
            <div style={{
              display: "flex",
              flex: 1,
              minWidth: 0
            }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div
                  key={index}
                  style={{
                    flex: "1 1 0",
                    textAlign: "center",
                    color: index === 5 ? "#6667AB" : index === 6 ? "#BB2649" : "#9E9C98",
                    marginRight: index < 6 ? 2 : 0,
                    minWidth: 0
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
          flex: 1,
          minWidth: "calc(50% - min(12px, 3vw) / 2)",
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
              width: 25, // 눈금 레이블 너비 조정
              height: 70,
              position: "relative",
              marginRight: 5,
              flexShrink: 0
            }}>
              {songTicks.map((songs, index) => (
                <div key={index} style={{ // key를 index로 변경 (tick 값이 중복될 수 있으므로)
                  position: "absolute",
                  top: index * (70 / (songTicks.length -1)), // 눈금 간격 조정
                  left: 0, // 왼쪽 정렬로 변경
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
              flex: 1,
              minWidth: 0
            }}>
              {weekData.songData.map((value, index) => {
                const isToday = weekData.dates[index].format("YYYY-MM-DD") === today;
                const height = calculateBarHeight(value, songMaxValue);
                
                return (
                  <div
                    key={index}
                    style={{
                      flex: "1 1 0",
                      height: height,
                      backgroundColor: isToday ? "#F0C05A" : "#F0EAD6",
                      borderRadius: 2,
                      marginRight: index < 6 ? 2 : 0,
                      minWidth: 0
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
            <div style={{ width: 30, flexShrink: 0 }} /> {/* 눈금 레이블 너비만큼 공간 확보 */}
            <div style={{
              display: "flex",
              flex: 1,
              minWidth: 0
            }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div
                  key={index}
                  style={{
                    flex: "1 1 0",
                    textAlign: "center",
                    color: index === 5 ? "#6667AB" : index === 6 ? "#BB2649" : "#9E9C98",
                    marginRight: index < 6 ? 2 : 0,
                    minWidth: 0
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