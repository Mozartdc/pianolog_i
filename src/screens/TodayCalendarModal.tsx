"use client";
import React, { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ko";

// 아이콘 imports
import SongNoteIcon from "../assets/icons/song_note.svg?react";
import CompleteIcon from "../assets/icons/complete.svg?react";
import DonotIcon from "../assets/icons/donot.svg?react";
import CalDownIcon from "../assets/icons/cal_down.svg?react";
import CalLeftIcon from "../assets/icons/cal_left.svg?react";
import CalRightIcon from "../assets/icons/cal_right.svg?react";
import CheckIcon from "../assets/icons/check.svg?react";
import UncheckIcon from "../assets/icons/uncheck.svg?react";
import StarIcon from "../assets/icons/star.svg?react";

type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

type PracticeChecks = {
  [date: string]: { [trackId: number]: boolean };
};

interface PracticeRecord {
  date: string;
  practiceTime: number;
  startTime: number;
  endTime: number;
  id: string;
  memo?: string;
  track?: string;
}

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
  onPracticeUpdate,
}) => {
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showUncompleteConfirm, setShowUncompleteConfirm] = useState(false); // ✅ 추가
  const [tracks, setTracks] = useState<Track[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>({});
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    const savedTracks = localStorage.getItem("tracks");
    setTracks(savedTracks ? JSON.parse(savedTracks) : []);
    const savedChecks = localStorage.getItem("practiceChecks");
    setPracticeChecks(savedChecks ? JSON.parse(savedChecks) : {});
  }, []);

  const track = tracks.find((t) => t.id === trackId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  const handleDayClick = (date: Dayjs) => {
    const dateStr = toDateStr(date);
    const todayStr = toDateStr(dayjs());
    if (dateStr > todayStr) return;

    setPracticeChecks((prev) => {
      const dayChecks = prev[dateStr] ? { ...prev[dateStr] } : {};
      const wasChecked = dayChecks[trackId!];
      dayChecks[trackId!] = !dayChecks[trackId!];
      const updated = { ...prev, [dateStr]: dayChecks };
      localStorage.setItem("practiceChecks", JSON.stringify(updated));
      const practiceRecords: PracticeRecord[] = JSON.parse(localStorage.getItem("practiceRecords") || "[]");
      if (!wasChecked) {
        const existingRecord = practiceRecords.find((r: PracticeRecord) =>
          r.date === dateStr && (r.track === track?.title || r.id.includes(`${trackId}`))
        );
        if (!existingRecord) {
          const newRecord: PracticeRecord = {
            id: `${dateStr}-${track?.id}-${Date.now()}`,
            date: dateStr,
            practiceTime: 30,
            track: track?.title,
            startTime: new Date(dateStr + "T09:00:00").getTime(),
            endTime: new Date(dateStr + "T09:30:00").getTime(),
            memo: `${track?.title} 과거 연습 기록`
          };
          practiceRecords.push(newRecord);
          localStorage.setItem("practiceRecords", JSON.stringify(practiceRecords));
        }
      } else {
        const filteredRecords = practiceRecords.filter((r: PracticeRecord) =>
          !(r.date === dateStr && (r.track === track?.title || r.id.includes(`${trackId}`)))
        );
        if (filteredRecords.length !== practiceRecords.length) {
          localStorage.setItem("practiceRecords", JSON.stringify(filteredRecords));
        }
      }
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

  // ✅ 곡 완성/해제 핸들러
  const handleComplete = () => {
    if (isCompleted) {
      setShowUncompleteConfirm(true); // 커스텀 해제 모달 오픈
    } else {
      const today = toDateStr(dayjs());
      const updatedTracks = tracks.map((t) =>
        t.id === trackId ? { ...t, completedDate: today } : t
      );
      setTracks(updatedTracks);
      localStorage.setItem("tracks", JSON.stringify(updatedTracks));
      setShowCompleteConfirm(true);
    }
  };

  // ✅ 해제 모달에서 '해제' 버튼 클릭 시
  const handleUncomplete = () => {
    const updatedTracks = tracks.map((t) =>
      t.id === trackId ? { ...t, completedDate: undefined } : t
    );
    setTracks(updatedTracks);
    localStorage.setItem("tracks", JSON.stringify(updatedTracks));
    setShowUncompleteConfirm(false);
    if (onPracticeUpdate) onPracticeUpdate();
    onClose();
  };

  const goToPrevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
  const goToNextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));
  const handleYearChange = (year: number) => {
    setCurrentMonth(currentMonth.year(year));
    setShowYearPicker(false);
  };

  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startOfWeek = startOfMonth.startOf("week").add(1, "day");
    const endOfWeek = endOfMonth.endOf("week").add(1, "day");
    const days = [];
    let current = startOfWeek;
    while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, "day")) {
      days.push(current);
      current = current.add(1, "day");
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const getDayStatus = (date: Dayjs) => {
    const dateStr = toDateStr(date);
    const checked = !!(practiceChecks[dateStr] && practiceChecks[dateStr][trackId!]);
    const isFuture = date.isAfter(dayjs(), "day");
    const existed =
      track.addedDate <= dateStr &&
      (!track.completedDate || dateStr <= track.completedDate);
    const isCurrentMonth = date.month() === currentMonth.month();
    return { checked, isFuture, existed, isCurrentMonth };
  };

  const isCompleted = !!track.completedDate;
  const totalPracticeDays = Object.keys(practiceChecks).filter(
    (date) => practiceChecks[date] && practiceChecks[date][trackId!]
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
        fontFamily: "var(--FONT_FAMILY)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "calc(100% - 32px)",
          maxWidth: 324,
          height: "auto",
          maxHeight: "calc(100% - 64px)",
          background: "var(--bg-primary)",
          borderRadius: "var(--border-radius-small)",
          border: "var(--border-light)",
          boxSizing: "border-box",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 곡명 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
          <SongNoteIcon style={{ color: "var(--VERY_PERI)" }} width="16" height="16" />
          <span
            style={{
              fontSize: 16,
              color: "var(--text-primary)",
              fontWeight: "normal",
              fontFamily: "var(--FONT_FAMILY)",
            }}
          >
            {track.title}
          </span>
        </div>

        {/* 총 연습 일수 */}
        <div
          style={{
            fontSize: 16,
            color: "var(--text-primary)",
            fontWeight: "normal",
            fontFamily: "var(--FONT_FAMILY)",
            marginBottom: 10,
          }}
        >
          총 {totalPracticeDays}일 연습
        </div>

        {/* 곡 완성 체크박스 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "8px 12px",
            border: "var(--border-light)",
            borderRadius: 3,
            width: "100%",
            height: 33,
            margin: "0 auto 10px auto",
            cursor: "pointer",
          }}
          onClick={handleComplete}
        >
          <div
            style={{
              width: 14,
              height: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isCompleted ? "var(--VERY_PERI)" : "var(--text-secondary)"
            }}
          >
            {isCompleted ? <CheckIcon width="14" height="14" /> : <UncheckIcon width="14" height="14" />}
          </div>
          <span
            style={{
              fontSize: 14,
              color: "var(--text-primary)",
              fontWeight: "normal",
              fontFamily: "var(--FONT_FAMILY)",
            }}
          >
            곡 완성
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--VIVA_MAGENTA)",
              marginLeft: "auto",
            }}
          >
            *내일 부터 연습 목록에서 삭제
          </span>
        </div>

        {/* 캘린더 */}
        <div style={{ marginTop: 16 }}>
          {/* 캘린더 헤더 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <button
              onClick={goToPrevMonth}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <CalLeftIcon width="14" height="8" />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
              <span
                style={{
                  fontSize: 16,
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  fontFamily: "var(--FONT_FAMILY)",
                }}
              >
                {currentMonth.format("YYYY년 MM월")}
              </span>
              <button
                onClick={() => setShowYearPicker(!showYearPicker)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                <CalDownIcon width="9" height="6" />
              </button>

              {showYearPicker && (
                <div
                  style={{
                    position: "absolute",
                    top: 25,
                    left: 0,
                    background: "var(--bg-primary)",
                    border: "var(--border-light)",
                    borderRadius: 4,
                    padding: 8,
                    zIndex: 1001,
                    maxHeight: 150,
                    overflowY: "auto",
                  }}
                >
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
                          color: "var(--text-primary)",
                          fontFamily: "var(--FONT_FAMILY)",
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
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <CalRightIcon width="14" height="8" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div
            style={{
              display: "flex",
              height: 24,
              width: "100%",
              marginBottom: 10,
            }}
          >
            {["m", "t", "w", "t", "f", "s", "s"].map((day, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-primary)",
                  fontWeight: "normal",
                  fontFamily: "var(--FONT_FAMILY)",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 캘린더 그리드 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
            }}
          >
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                style={{
                  display: "flex",
                  height: 32,
                  width: "100%",
                }}
              >
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
                        opacity: !isCurrentMonth ? 0.3 : 1,
                      }}
                      onClick={() => !isFuture && isCurrentMonth && handleDayClick(date)}
                    >
                      {existed && isCurrentMonth && (
                        checked
                          ? <CompleteIcon style={{
                              position: "absolute",
                              zIndex: 1,
                              width: 32,
                              height: 32,
                              color: "var(--VERY_PERI)",
                              opacity: 0.5
                            }} />
                          : <DonotIcon style={{
                              position: "absolute",
                              zIndex: 1,
                              width: 32,
                              height: 32,
                              color: "var(--text-secondary)",
                              opacity: 0.3
                            }} />
                      )}
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          zIndex: 2,
                          position: "relative",
                          fontFamily: "var(--FONT_FAMILY)",
                          color: dayIndex === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-primary)",
                        }}
                      >
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
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
            width: "100%",
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "auto",
              padding: "4px 8px",
              background: "var(--text-secondary)",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              color: "var(--button-primary-text)",
              cursor: "pointer",
              fontFamily: "var(--FONT_FAMILY)",
            }}
          >
            닫기
          </button>
        </div>
      </div>

{/* 곡 완성 확인 모달 */}
      {showCompleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '40px',
            borderRadius: 8,
            textAlign: 'center'
          }}>
            {/* ✅ [수정] 아이콘과 텍스트를 flexbox로 묶어 정렬합니다. */}
            <div style={{
              fontSize: 18,
              color: 'var(--VERY_PERI)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <StarIcon width="20" height="20" />
              <span>곡 완성 축하해요!</span>
            </div>
            <div style={{
              fontSize: 14,
              color: 'var(--text-secondary)'
            }}>
              내일부터 연습 목록에 보이지 않습니다.
            </div>
          </div>
        </div>
      )}

      {/* 곡 완성 해제 확인 모달 */}
      {showUncompleteConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '40px 32px 32px 32px',
            borderRadius: 8,
            textAlign: 'center',
            minWidth: 260
          }}>
            <div style={{
              fontSize: 18,
              color: 'var(--VERY_PERI)',
              marginBottom: 16,
              fontWeight: 'bold'
            }}>
              곡 다시 진행
            </div>
            <div style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              marginBottom: 24
            }}>
              다시 연습하시겠습니까?
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowUncompleteConfirm(false)}
                style={{
                  padding: "8px 20px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-light)",
                  borderRadius: 6,
                  fontSize: 15,
                  color: "var(--text-secondary)",
                  cursor: "pointer"
                }}
              >
                취소
              </button>
              <button
                onClick={handleUncomplete}
                style={{
                  padding: "8px 20px",
                  background: "var(--VERY_PERI)",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 15,
                  color: "#fff",
                  cursor: "pointer"
                }}
              >
                재등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayCalendarModal;
