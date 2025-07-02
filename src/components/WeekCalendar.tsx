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
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const CARD_WIDTH = 42;
  const GAP = 8;
  const TOTAL_CARD_WIDTH = CARD_WIDTH + GAP; // 50px
  const SCREEN_WIDTH = 343;

  // ✅ 2년 범위 무한 스크롤
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
  
  // ✅ 선택된 날짜의 인덱스 찾기
  const selectedDateIndex = allDates.findIndex(date => date.format("YYYY-MM-DD") === selectedDate);
  
  // ✅ 화면 정중앙 계산
  const calculateCenterTransform = () => {
    if (selectedDateIndex === -1) return 0;
    const cardCenterPos = selectedDateIndex * TOTAL_CARD_WIDTH + CARD_WIDTH / 2;
    const screenCenterPos = SCREEN_WIDTH / 2;
    return screenCenterPos - cardCenterPos;
  };

  // ✅ 부드러운 애니메이션으로 위치 이동 (개선됨)
  const animateToPosition = (targetTransform: number) => {
    if (!containerRef.current) return;
    
    setIsAnimating(true);
    setBaseTranslateX(targetTransform);
    setCurrentTranslateX(0);
    
    // ✅ GPU 가속과 부드러운 easing
    containerRef.current.style.willChange = "transform";
    containerRef.current.style.transition = "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.transition = "none";
        containerRef.current.style.willChange = "auto";
      }
      setIsAnimating(false);
    }, 400);
  };

  // ✅ selectedDate 변경 시 중앙으로 부드럽게 이동
  useEffect(() => {
    const centerTransform = calculateCenterTransform();
    animateToPosition(centerTransform);
  }, [selectedDate]);

  // ✅ 가장 가까운 날짜로 스냅
  const snapToNearestDate = () => {
    const currentPosition = baseTranslateX + currentTranslateX;
    const screenCenter = SCREEN_WIDTH / 2;
    const approximateIndex = Math.round((screenCenter - currentPosition) / TOTAL_CARD_WIDTH);
    
    if (approximateIndex >= 0 && approximateIndex < allDates.length) {
      const targetDate = allDates[approximateIndex];
      if (targetDate && targetDate.format("YYYY-MM-DD") !== selectedDate) {
        const targetTransform = calculateCenterTransform();
        setBaseTranslateX(currentPosition);
        setCurrentTranslateX(0);
      }
    }
  };

  // ✅ 날짜 클릭 핸들러
  const handleDateClick = (dateStr: string) => {
    console.log("날짜 선택:", dateStr);
    localStorage.setItem("lastSelectedDate", dateStr);
    onDateClick(dateStr);
  };

  // ✅ 터치 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    
    setTouchStartPos({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
    setHasMoved(false);
    setIsDragging(false);
    setStartX(e.touches[0].clientX);
  };

  // ✅ 터치 이동
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos || isAnimating) return;
    
    const deltaX = e.touches[0].clientX - touchStartPos.x;
    const deltaY = e.touches[0].clientY - touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 15) {
      setIsDragging(true);
      setHasMoved(true);
      e.preventDefault();
      
      const scrollDelta = e.touches[0].clientX - startX;
      setCurrentTranslateX(prev => prev + scrollDelta);
      setStartX(e.touches[0].clientX);
    }
  };

  // ✅ 터치 종료
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isAnimating) return;
    
    if (hasMoved && isDragging) {
      setBaseTranslateX(prev => prev + currentTranslateX);
      setCurrentTranslateX(0);
      
      setTimeout(() => {
        snapToNearestDate();
      }, 50);
    }
    
    setIsDragging(false);
    setTouchStartPos(null);
    setHasMoved(false);
    setStartX(0);
  };

  // ✅ 마우스 이벤트
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDragging || isAnimating) return;
    
    const deltaX = e.clientX - startX;
    setCurrentTranslateX(prev => prev + deltaX);
    setStartX(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isAnimating) return;
    e.preventDefault();
    
    if (isDragging) {
      setBaseTranslateX(prev => prev + currentTranslateX);
      setCurrentTranslateX(0);
      setTimeout(() => {
        snapToNearestDate();
      }, 50);
    }
    
    setIsDragging(false);
    setStartX(0);
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: 343,
        height: 56,
        margin: "15px auto 0 auto",
        overflow: "hidden",
        touchAction: "pan-y",
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "grab",
        // ✅ 하드웨어 가속 활성화
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)"
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
          // ✅ 부드러운 렌더링 최적화
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
          WebkitPerspective: 1000,
          perspective: 1000
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
          
          // ✅ 연습 시간에 따른 색상 강도
          const practiceMinutes = Array.isArray(practiceRecords)
            ? practiceRecords
                .filter(r => r && r.date === dateStr)
                .reduce((sum, r) => sum + (r.practiceTime || 0), 0)
            : 0;
          
          const practiceIntensity = Math.min(practiceMinutes / 60, 1);
          const borderColor = practiced 
            ? `rgba(69, 181, 170, ${0.6 + practiceIntensity * 0.4})`
            : "#9e9c98";
          
          return (
            <div
              key={index}
              style={{
                position: "relative",
              }}
            >
              {/* ✅ 월 경계 표시 */}
              {date.date() === 1 && (
                <div style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 8,
                  color: "#9e9c98",
                  background: "white",
                  padding: "1px 4px",
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  zIndex: 10,
                  ...commonFontStyle
                }}>
                  {date.format("MMM")}
                </div>
              )}
              
              <div
                onClick={(e) => {
                  e.preventDefault();
                  if (!('ontouchstart' in window) && !isDragging && !isAnimating) {
                    handleDateClick(dateStr);
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (!hasMoved && !isDragging && !isAnimating) {
                    console.log("모바일 터치 성공:", dateStr);
                    handleDateClick(dateStr);
                  }
                }}
                style={{
                  width: CARD_WIDTH,
                  height: 56,
                  background: isToday ? "#c7e6df" : isSelected ? "#f0f0f0" : "#ffffff",
                  border: practiced ? `1px solid ${borderColor}` : "1px solid #9e9c98",
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  marginRight: GAP,
                  flexShrink: 0,
                  WebkitTapHighlightColor: "transparent",
                  // ✅ 크기 변화 없이 색상 강조만
                  boxShadow: isSelected 
                    ? "inset 0 0 0 0.5px rgba(69, 181, 170, 0.5)"
                    : "none",
                  transition: isAnimating ? "none" : "box-shadow 0.15s ease",
                  zIndex: isSelected ? 5 : 1,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  // ✅ 안정적인 크기 유지
                  minWidth: CARD_WIDTH,
                  maxWidth: CARD_WIDTH,
                  minHeight: 56,
                  maxHeight: 56
                }}
              >
                <span style={{
                  fontSize: 18,
                  color: "#2d2d2a",
                  lineHeight: "22px",
                  textAlign: "center",
                  ...commonFontStyle
                }}>
                  {date.format("D")}
                </span>
                <span style={{
                  fontSize: 9,
                  color: isSunday || isHoliday ? "#bb2649" : isSaturday ? "#0066cc" : "#9e9c98",
                  lineHeight: "14px",
                  textAlign: "center",
                  ...commonFontStyle
                }}>
                  {date.format("ddd").toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekCalendar;
