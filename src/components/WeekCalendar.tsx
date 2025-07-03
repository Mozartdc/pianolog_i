import React, { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";

interface PracticeRecord {
  date: string;
  practiceTime: number;
}

interface WeekCalendarProps {
  selectedDate: string;
  practiceRecords: PracticeRecord[];
  onDateClick: (dateStr: string) => void;
  getKoreanHolidays: (year: number) => string[];
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({
  selectedDate,
  practiceRecords,
  onDateClick,
  getKoreanHolidays
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [currentTranslateX, setCurrentTranslateX] = useState<number>(0);
  const [baseTranslateX, setBaseTranslateX] = useState<number>(0);
  const [touchStartPos, setTouchStartPos] = useState<{x: number, y: number} | null>(null);
  const [hasMoved, setHasMoved] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const CARD_WIDTH = 42;
  const GAP = 8;
  const TOTAL_CARD_WIDTH = CARD_WIDTH + GAP; // 50px
  
  // ✅ 완전 반응형: 고정 SCREEN_WIDTH 제거, 동적 계산
  const getScreenWidth = () => {
    if (containerRef.current) {
      return containerRef.current.offsetWidth;
    }
    return 343; // 기본값
  };

  // 2년 범위 무한 스크롤
  const generateContinuousDates = () => {
    const baseDate = dayjs(selectedDate);
    const dates = [];
    
    for (let i = -365; i <= 365; i++) {
      dates.push(baseDate.add(i, 'day'));
    }
    
    return dates;
  };

  const allDates = generateContinuousDates();
  const today = dayjs();
  const todayStr = today.format("YYYY-MM-DD");
  
  // 선택된 날짜의 인덱스 찾기
  const selectedDateIndex = allDates.findIndex(date => date.format("YYYY-MM-DD") === selectedDate);
  
  // ✅ 화면 정중앙 계산 - 동적 화면 너비 사용
  const calculateCenterTransform = () => {
    if (selectedDateIndex === -1) return 0;
    const screenWidth = getScreenWidth();
    const cardCenterPos = selectedDateIndex * TOTAL_CARD_WIDTH + CARD_WIDTH / 2;
    const screenCenterPos = screenWidth / 2;
    return screenCenterPos - cardCenterPos;
  };

  // selectedDate 변경 시 중앙으로 이동
  useEffect(() => {
    const centerTransform = calculateCenterTransform();
    setBaseTranslateX(centerTransform);
    setCurrentTranslateX(0);
  }, [selectedDate]);

  // 날짜 클릭 핸들러
  const handleDateClick = (dateStr: string) => {
    console.log("날짜 선택:", dateStr);
    localStorage.setItem("lastSelectedDate", dateStr);
    onDateClick(dateStr);
  };

  // 터치 시작 - 개선된 버전
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartPos({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
    setHasMoved(false);
    setIsDragging(false);
    setStartX(e.touches[0].clientX);
  };

  // 터치 이동 - 개선된 버전
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos) return;
    
    const deltaX = e.touches[0].clientX - touchStartPos.x;
    const deltaY = e.touches[0].clientY - touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 15px 이상 움직이면 드래그로 인식
    if (distance > 15) {
      setIsDragging(true);
      setHasMoved(true);
      e.preventDefault(); // 드래그 시에만 기본 동작 차단
      
      const scrollDelta = e.touches[0].clientX - startX;
      setCurrentTranslateX(prev => prev + scrollDelta);
      setStartX(e.touches[0].clientX);
    }
  };

  // 터치 종료 - 개선된 버전
  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    setTouchStartPos(null);
    setHasMoved(false);
    setStartX(0);
  };

  // 마우스 이벤트 (데스크톱)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    setCurrentTranslateX(prev => prev + deltaX);
    setStartX(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setStartX(0);
  };

  return (
    <div 
      ref={containerRef}
      style={{
        // ✅ 완전 반응형: 고정 maxWidth 제거
        width: "calc(100% - 32px)", // 좌우 16px 패딩 고려
        height: 56,
        margin: "15px auto 0 auto",
        overflow: "hidden",
        touchAction: "pan-y",
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "grab",
        fontFamily: "var(--FONT_FAMILY)" // ✅ CSS 변수 적용
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: `${allDates.length * TOTAL_CARD_WIDTH}px`,
          transform: `translateX(${baseTranslateX + currentTranslateX}px)`,
          transition: "none",
        }}
      >
        {allDates.map((date, index) => {
          const dateStr = date.format("YYYY-MM-DD");
          const practiced = Array.isArray(practiceRecords) 
            ? practiceRecords.some((r: PracticeRecord) => r && r.date === dateStr)
            : false;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isSunday = date.day() === 0;
          const isSaturday = date.day() === 6;
          const koreanHolidays = getKoreanHolidays(date.year());
          const isHoliday = koreanHolidays.includes(dateStr);
          
          return (
            <div
              key={index}
              // 데스크톱 클릭
              onClick={(e) => {
                e.preventDefault();
                if (!('ontouchstart' in window) && !isDragging) {
                  handleDateClick(dateStr);
                }
              }}
              // 모바일 터치 - 완전히 개선된 버전
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // 드래그하지 않았을 때만 날짜 선택
                if (!hasMoved && !isDragging) {
                  console.log("모바일 터치 성공:", dateStr);
                  handleDateClick(dateStr);
                }
              }}
              style={{
                width: CARD_WIDTH,
                height: 56,
                // ✅ CSS 변수 적용
                background: isToday 
                  ? "var(--PASTEL_TURQUOISE)" 
                  : isSelected 
                    ? "var(--info-bg)" 
                    : "var(--bg-primary)",
                border: practiced 
                  ? `0.5px solid var(--TURQUOISE)` 
                  : "var(--border-light)",
                borderRadius: "var(--border-radius-large)", // ✅ CSS 변수 적용
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginRight: GAP,
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
                transition: "var(--transition-fast)" // ✅ 부드러운 호버 효과
              }}
            >
              <span style={{
                fontSize: 18,
                color: "var(--text-primary)", // ✅ CSS 변수 적용
                lineHeight: "22px",
                textAlign: "center",
                ...commonFontStyle
              }}>
                {date.format("D")}
              </span>
              <span style={{
                fontSize: 9,
                // ✅ CSS 변수 적용
                color: isSunday || isHoliday 
                  ? "var(--VIVA_MAGENTA)" 
                  : isSaturday 
                    ? "#0066cc" // 토요일은 파란색 유지 (CSS 변수에 추가 고려)
                    : "var(--text-secondary)",
                lineHeight: "14px",
                textAlign: "center",
                ...commonFontStyle
              }}>
                {date.format("ddd").toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekCalendar;
