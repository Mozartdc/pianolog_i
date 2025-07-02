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
  completedDate?: string;
};

type PracticeChecks = {
  [date: string]: { [trackId: number]: boolean };
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
  onPracticeUpdate,
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
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // 모달 열릴 때 스크롤 방지
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // 모달 닫힐 때 스크롤 복원
    };
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  // 날짜 클릭 핸들러
  const handleDayClick = (date: Dayjs) => {
    const dateStr = toDateStr(date);
    const todayStr = toDateStr(dayjs());
    if (dateStr > todayStr) return; // 미래 날짜는 클릭 불가

    setPracticeChecks((prev) => {
      const dayChecks = prev[dateStr] ? { ...prev[dateStr] } : {};
      dayChecks[trackId!] = !dayChecks[trackId!];
      const updated = { ...prev, [dateStr]: dayChecks };
      localStorage.setItem("practiceChecks", JSON.stringify(updated));
      if (onPracticeUpdate) onPracticeUpdate();
      return updated;
    });

    // addedDate 업데이트 로직
    if (track.addedDate > dateStr) {
      const tracksRaw = localStorage.getItem("tracks");
      if (tracksRaw) {
        const tracksArr = JSON.parse(tracksRaw);
        const idx = tracksArr.findIndex((t: any) => t.id === trackId);
        if (idx !== -1) {
          tracksArr[idx].addedDate = dateStr;
          localStorage.setItem("tracks", JSON.stringify(tracksArr));
          setTracks(tracksArr); // 상태 업데이트
        }
      }
    }

    setSelectedDate(date); // 선택된 날짜 업데이트 (선택 표시에 사용될 경우)
  };

  // 곡 완성 핸들러
  const handleComplete = () => {
    if (isCompleted) { // 이미 완성된 곡은 다시 토글하지 않음
      alert("이미 완성 처리된 곡입니다.");
      return;
    }
    const today = toDateStr(dayjs());
    const updatedTracks = tracks.map((t) =>
      t.id === trackId ? { ...t, completedDate: today } : t
    );
    setTracks(updatedTracks);
    localStorage.setItem("tracks", JSON.stringify(updatedTracks));
    alert("곡이 완성 처리되었습니다! 내일부터 리스트에 보이지 않습니다.");
    if (onPracticeUpdate) onPracticeUpdate();
    onClose();
  };

  // 월 이동
  const goToPrevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
  const goToNextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));
  const handleYearChange = (year: number) => {
    setCurrentMonth(currentMonth.year(year));
    setShowYearPicker(false);
  };

  // 캘린더 날짜 생성
  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startOfWeek = startOfMonth.startOf("week").add(1, "day"); // 월요일을 시작으로
    const endOfWeek = endOfMonth.endOf("week").add(1, "day"); // 월요일을 시작으로
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

  // 날짜별 상태 확인
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
        fontFamily: "var(--Pretendard)", // ✅ CSS 변수 사용
      }}
      onClick={onClose}
    >
      <div
        style={{
          // ✅ 반응형으로 변경: 최대 너비 324px, 화면 여백 16px을 고려하여 100% 너비 적용
          width: "calc(100% - 32px)",
          maxWidth: 324,
          // ✅ 높이도 유동적으로 변경: 콘텐츠에 맞춰 늘어나고, 넘칠 경우 스크롤
          height: "auto",
          maxHeight: "calc(100% - 64px)", // 상하 여백 고려 (예: 32px * 2)
          background: "var(--WHITE)", // ✅ CSS 변수 사용
          borderRadius: 5,
          border: "0.5px solid var(--VERY_PERI)", // ✅ CSS 변수 사용 (6667AB 대신)
          boxSizing: "border-box",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflowY: "auto", // 내용이 넘칠 경우 스크롤
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 곡명 */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}
        >
          <img src={SongNoteIcon} alt="song note" width="16" height="16" />
          <span
            style={{
              fontSize: 16,
              color: "var(--BLACK)", // ✅ CSS 변수 사용
              fontWeight: "normal",
              fontFamily: "var(--Pretendard)", // ✅ CSS 변수 사용
            }}
          >
            {track.title}
          </span>
        </div>

        {/* 총 연습 일수 */}
        <div
          style={{
            fontSize: 16,
            color: "var(--BLACK)", // ✅ CSS 변수 사용
            fontWeight: "normal",
            fontFamily: "var(--Pretendard)", // ✅ CSS 변수 사용
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
            border: "0.5px solid var(--VERY_PERI)", // ✅ CSS 변수 사용
            borderRadius: 3,
            width: "100%", // ✅ width 고정값 대신 100%
            height: 33, // 고정 높이 유지 (디자인 의도에 따라)
            margin: "0 auto 10px auto",
            cursor: isCompleted ? "default" : "pointer", // 완성된 곡은 커서 변경
          }}
          onClick={handleComplete} // ✅ 부모 div에 클릭 핸들러 부여
        >
          <div
            style={{
              width: 14,
              height: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isCompleted ? (
              <img src={CheckIcon} alt="checked" width="14" height="14" />
            ) : (
              <img src={UncheckIcon} alt="unchecked" width="14" height="14" />
            )}
          </div>
          <span
            style={{
              fontSize: 14,
              color: "var(--BLACK)", // ✅ CSS 변수 사용
              fontWeight: "normal",
              fontFamily: "var(--Pretendard)", // ✅ CSS 변수 사용
            }}
          >
            곡 완성
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--ERROR_COLOR)", // ✅ CSS 변수 사용 (BB2649 대신)
              marginLeft: "auto",
            }}
          >
            *내일 부터 연습 목록에서 삭제
          </span>
        </div>

        {/* ✅ 캘린더 시작점: 곡완성 박스에서 16px 아래로 */}
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
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <img src={CalLeftIcon} alt="previous month" width="14" height="8" />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
              <span
                style={{
                  fontSize: 16,
                  color: "var(--DARK_GRAY)", // ✅ CSS 변수 사용
                  textAlign: "center",
                  fontFamily: "var(--Pretendard)", // ✅ CSS 변수 사용
                }}
              >
                {currentMonth.format("YYYY년 MM월")}
              </span>
              <button
                onClick={() => setShowYearPicker(!showYearPicker)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <img src={CalDownIcon} alt="year picker" width="9" height="6" />
              </button>

              {showYearPicker && (
                <div
                  style={{
                    position: "absolute",
                    top: 25,
                    left: 0,
                    background: "var(--WHITE)", // ✅ CSS 변수 사용
                    border: "1px solid var(--VERY_PERI)", // ✅ CSS 변수 사용
                    borderRadius: 4,
                    padding: 8,
                    zIndex: 1001,
                    maxHeight: 150,
                    overflowY: "auto",
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = dayjs().year() - 5 + i; // 현재 년도 기준 -5년부터 +4년까지 표시
                    return (
                      <div
                        key={year}
                        onClick={() => handleYearChange(year)}
                        style={{
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: 14,
                          color: "var(--BLACK)", // ✅ CSS 변수 사용
                          fontFamily: "var(--Pretendard)", // ✅ CSS 변수 사용
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
          <div
            style={{
              display: "flex",
              height: 24, // 고정 높이 유지 (디자인 의도에 따라)
              width: "100%", // ✅ width 고정값 대신 100%
              marginBottom: 10,
            }}
          >
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div
                key={index}
                style={{
                  flex: 1, // 각 요일 칸이 유동적으로 너비를 차지
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: index === 6 ? "var(--ERROR_COLOR)" : "var(--BLACK)", // ✅ CSS 변수 사용
                  fontWeight: "normal",
                  fontFamily: "var(--Pretendard)", // ✅ CSS 변수 사용
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
              width: "100%", // ✅ width 고정값 대신 100%
            }}
          >
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                style={{
                  display: "flex",
                  height: 32, // 고정 높이 유지 (디자인 의도에 따라)
                  width: "100%", // ✅ width 고정값 대신 100%
                }}
              >
                {week.map((date, dayIndex) => {
                  const { checked, isFuture, existed, isCurrentMonth } =
                    getDayStatus(date);

                  return (
                    <div
                      key={dayIndex}
                      style={{
                        flex: 1, // 각 날짜 칸이 유동적으로 너비를 차지
                        height: 32, // 고정 높이 유지 (아이콘 크기와 맞춰짐)
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        cursor:
                          isFuture || !isCurrentMonth ? "default" : "pointer",
                        opacity: !isCurrentMonth ? 0.3 : 1,
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
                            opacity: checked ? 1 : 0.5,
                          }}
                        />
                      )}

                      <span
                        style={{
                          fontSize: 16,
                          color:
                            dayIndex === 6 ? "var(--ERROR_COLOR)" : "var(--BLACK)", // ✅ CSS 변수 사용
                          fontWeight: "normal",
                          zIndex: 2,
                          position: "relative",
                          fontFamily: "var(--Pretendard)", // ✅ CSS 변수 사용
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
            width: "100%", // ✅ width 고정값 대신 100%
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "auto", // ✅ 너비 유동적으로 변경
              padding: "4px 8px", // ✅ 패딩으로 크기 조절
              background: "var(--DARK_GRAY)", // ✅ CSS 변수 사용 (C4C3D0 대신)
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              color: "var(--BLACK)", // ✅ CSS 변수 사용
              cursor: "pointer",
              fontFamily: "var(--Pretendard)", // ✅ CSS 변수 사용
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