"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ko";

// 아이콘 imports
import SongNoteIcon from "../assets/icons/song_note.svg";
import CompleteIcon from "../assets/icons/complete.svg";
import DonotIcon from "../assets/icons/donot.svg";
import CalDownIcon from "../assets/icons/cal_down.svg";
import CalLeftIcon from "../assets/icons/cal_left.svg";
import CalRightIcon from "../assets/icons/cal_right.svg";
import CheckIcon from "../assets/icons/check.svg";
import UncheckIcon from "../assets/icons/uncheck.svg";

type Track = { 
  id: number; 
  title: string; 
  addedDate: string; 
  completedDate?: string 
};

type PracticeChecks = { 
  [date: string]: { [trackId: number]: boolean } 
};

function toDateStr(date: Dayjs) {
  return date.format("YYYY-MM-DD");
}

interface TodayCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId?: number;
  onPracticeUpdate?: () => void;
}

const TodayCalendarModal: React.FC<TodayCalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  trackId,
  onPracticeUpdate
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>({});
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // 데이터 로딩
  useEffect(() => {
    const savedTracks = localStorage.getItem("tracks");
    setTracks(savedTracks ? JSON.parse(savedTracks) : []);
    const savedChecks = localStorage.getItem("practiceChecks");
    setPracticeChecks(savedChecks ? JSON.parse(savedChecks) : {});
  }, []);

  const track = tracks.find((t) => t.id === trackId);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  // 날짜 클릭 핸들러
  const handleDayClick = (date: Dayjs) => {
    const dateStr = toDateStr(date);
    const todayStr = toDateStr(dayjs());
    if (dateStr > todayStr) return;

    setPracticeChecks((prev) => {
      const dayChecks = prev[dateStr] ? { ...prev[dateStr] } : {};
      dayChecks[trackId!] = !dayChecks[trackId!];
      const updated = { ...prev, [dateStr]: dayChecks };
      localStorage.setItem("practiceChecks", JSON.stringify(updated));
      if (onPracticeUpdate) onPracticeUpdate();
      return updated;
    });

    if (track.addedDate > dateStr) {
      const tracksRaw = localStorage.getItem("tracks");
      if (tracksRaw) {
        const tracksArr = JSON.parse(tracksRaw);
        const idx = tracksArr.findIndex((t: any) => t.id === trackId);
        if (idx !== -1) {
          tracksArr[idx].addedDate = dateStr;
          localStorage.setItem("tracks", JSON.stringify(tracksArr));
          setTracks(tracksArr);
        }
      }
    }

    setSelectedDate(date);
  };

  // 곡 완성 핸들러
  const handleComplete = () => {
    const today = toDateStr(dayjs());
    const updatedTracks = tracks.map(t =>
      t.id === trackId ? { ...t, completedDate: today } : t
    );
    setTracks(updatedTracks);
    localStorage.setItem("tracks", JSON.stringify(updatedTracks));
    alert("곡이 완성 처리되었습니다! 내일부터 리스트에 보이지 않습니다.");
    if (onPracticeUpdate) onPracticeUpdate();
    onClose();
  };

  // 월 이동
  const goToPrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const goToNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
  const handleYearChange = (year: number) => {
    setCurrentMonth(currentMonth.year(year));
    setShowYearPicker(false);
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

  // 날짜별 상태 확인
  const getDayStatus = (date: Dayjs) => {
    const dateStr = toDateStr(date);
    const checked = !!(practiceChecks[dateStr] && practiceChecks[dateStr][trackId!]);
    const isFuture = date.isAfter(dayjs(), 'day');
    const existed = track.addedDate <= dateStr && 
                   (!track.completedDate || dateStr <= track.completedDate);
    const isCurrentMonth = date.month() === currentMonth.month();
    return { checked, isFuture, existed, isCurrentMonth };
  };

  const isCompleted = !!track.completedDate;
  const totalPracticeDays = Object.keys(practiceChecks).filter(date => 
    practiceChecks[date] && practiceChecks[date][trackId!]
  ).length;

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: 324,
          height: 471, // ✅ 471로 줄임
          background: "#FFFFFF",
          borderRadius: 5,
          border: "0.5px solid #6667AB",
          boxSizing: "border-box",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 곡명 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
          <img src={SongNoteIcon} alt="song note" width="16" height="16" />
          <span style={{ 
            fontSize: 16, 
            color: "#2D2D2A", 
            fontWeight: "normal",
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
          }}>
            {track.title}
          </span>
        </div>

        {/* 총 연습 일수 */}
        <div style={{ 
          fontSize: 16, 
          color: "#2D2D2A", 
          fontWeight: "normal",
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
          marginBottom: 10
        }}>
          총 {totalPracticeDays}일 연습
        </div>

        {/* 곡 완성 체크박스 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "8px 12px",
          border: "0.5px solid #6667AB",
          borderRadius: 3,
          width: "calc(100%)",
          height: 33,
          margin: "0 auto 10px auto"
        }}>
          <div 
            onClick={handleComplete}
            style={{ 
              width: 14, 
              height: 14, 
              cursor: "pointer",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center"
            }}
          >
            {isCompleted ? (
              <img src={CheckIcon} alt="checked" width="14" height="14" />
            ) : (
              <img src={UncheckIcon} alt="unchecked" width="14" height="14" />
            )}
          </div>
          <span style={{ 
            fontSize: 14, 
            color: "#2D2D2A",
            fontWeight: "normal",
            fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
          }}>
            곡 완성
          </span>
          <span style={{ 
            fontSize: 10, 
            color: "#BB2649", 
            marginLeft: "auto" 
          }}>
            *내일 부터 연습 목록에서 삭제
          </span>
        </div>

        {/* ✅ 캘린더 시작점: 곡완성 박스에서 16px 아래로 */}
        <div style={{ marginTop: 16 }}>
          {/* 캘린더 헤더 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button
              onClick={goToPrevMonth}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <img src={CalLeftIcon} alt="previous month" width="14" height="8" />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
              <span style={{ 
                fontSize: 16, 
                color: "#9E9C98", 
                textAlign: "center",
                fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
              }}>
                {currentMonth.format("YYYY년 MM월")}
              </span>
              <button
                onClick={() => setShowYearPicker(!showYearPicker)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <img src={CalDownIcon} alt="year picker" width="9" height="6" />
              </button>
              
              {showYearPicker && (
                <div style={{
                  position: "absolute",
                  top: 25,
                  left: 0,
                  background: "white",
                  border: "1px solid #6667AB",
                  borderRadius: 4,
                  padding: 8,
                  zIndex: 1001,
                  maxHeight: 150,
                  overflowY: "auto"
                }}>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = dayjs().year() - 5 + i;
                    return (
                      <div
                        key={year}
                        onClick={() => handleYearChange(year)}
                        style={{
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: 14,
                          color: "#2D2D2A",
                          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
                        }}
                      >
                        {year}년
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={goToNextMonth}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <img src={CalRightIcon} alt="next month" width="14" height="8" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ 
            display: "flex", 
            height: 24,
            width: 292,
            marginBottom: 10
          }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: index === 6 ? "#BB2649" : "#2D2D2A",
                  fontWeight: "normal",
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 캘린더 그리드 */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 8, // ✅ 캘린더 내부 행 간격 8px
            width: 292
          }}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} style={{ 
                display: "flex", 
                height: 32,
                width: 292
              }}>
                {week.map((date, dayIndex) => {
                  const { checked, isFuture, existed, isCurrentMonth } = getDayStatus(date);
                  
                  return (
                    <div
                      key={dayIndex}
                      style={{
                        flex: 1,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        cursor: isFuture || !isCurrentMonth ? "default" : "pointer",
                        opacity: !isCurrentMonth ? 0.3 : 1
                      }}
                      onClick={() => !isFuture && isCurrentMonth && handleDayClick(date)}
                    >
                      {existed && isCurrentMonth && (
                        <img
                          src={checked ? CompleteIcon : DonotIcon}
                          alt={checked ? "practiced" : "not practiced"}
                          width="32"
                          height="32"
                          style={{
                            position: "absolute",
                            zIndex: 1,
                            opacity: checked ? 1 : 0.5
                          }}
                        />
                      )}
                      
                      <span style={{
                        fontSize: 16,
                        color: dayIndex === 6 ? "#BB2649" : "#2D2D2A",
                        fontWeight: "normal",
                        zIndex: 2,
                        position: "relative",
                        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
                      }}>
                        {date.date()}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 16, // 자동 여백
          width: 292
        }}>
          <button
            onClick={onClose}
            style={{
              width: 39,
              height: 24,
              background: "#C4C3D0",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              color: "#2D2D2A",
              cursor: "pointer",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodayCalendarModal;