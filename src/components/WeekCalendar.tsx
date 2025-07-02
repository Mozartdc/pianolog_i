import React, { useState, useRef, useEffect, useCallback } from "react";
import dayjs from "dayjs";
// dayjs 플러그인 임포트
import weekday from "dayjs/plugin/weekday";
import isoWeek from "dayjs/plugin/isoWeek";
import objectSupport from "dayjs/plugin/objectSupport"; 
import "dayjs/locale/ko"; // 한국어 로케일 임포트

dayjs.extend(weekday);
dayjs.extend(isoWeek);
dayjs.extend(objectSupport); // dayjs에 objectSupport 플러그인 확장
dayjs.locale("ko"); // dayjs 전역 로케일을 한국어로 설정

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
  const [isAnimating, setIsAnimating] = useState<boolean>(false); // 애니메이션 상태 유지
  const containerRef = useRef<HTMLDivElement>(null);

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const CARD_WIDTH = 42;
  const GAP = 8;
  const TOTAL_CARD_WIDTH = CARD_WIDTH + GAP; // 50px
  const SCREEN_WIDTH = 343; // 기존 SCREEN_WIDTH 값 유지

  // 2년 범위 무한 스크롤 (기존 로직 유지)
  const generateContinuousDates = useCallback(() => {
    // ✅ 수정: selectedDate를 기준으로 날짜 생성
    const baseDate = dayjs(selectedDate); 
    const dates = [];
    
    // 이전 1년과 이후 1년의 날짜를 포함
    for (let i = -365; i <= 365; i++) {
      dates.push(baseDate.add(i, 'day'));
    }
    
    return dates;
  }, [selectedDate]); // selectedDate가 변경되면 다시 생성하도록 의존성 추가

  const allDates = generateContinuousDates();
  const today = dayjs();
  const todayStr = today.format("YYYY-MM-DD");
  
  // 선택된 날짜의 인덱스 찾기
  // allDates는 현재 날짜 기준이므로, selectedDate에 해당하는 인덱스를 찾음
  const selectedDateIndex = allDates.findIndex(date => date.format("YYYY-MM-DD") === selectedDate);
  
  // 화면 정중앙 계산 (기존 로직 유지)
  const calculateCenterTransform = useCallback(() => {
    if (selectedDateIndex === -1) return 0;
    const cardCenterPos = selectedDateIndex * TOTAL_CARD_WIDTH + CARD_WIDTH / 2;
    const screenCenterPos = SCREEN_WIDTH / 2;
    return screenCenterPos - cardCenterPos;
  }, [selectedDateIndex, TOTAL_CARD_WIDTH, CARD_WIDTH, SCREEN_WIDTH]);

  // 부드러운 애니메이션으로 위치 이동 (기존 로직 유지)
  const animateToPosition = useCallback((targetTransform: number) => {
    if (!containerRef.current) return;
    
    setIsAnimating(true);
    // 현재 baseTranslateX에서 목표 targetTransform까지 애니메이션
    containerRef.current.style.transition = "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    containerRef.current.style.transform = `translateX(${targetTransform}px)`;

    setBaseTranslateX(targetTransform); // 애니메이션 완료 후 최종 위치
    setCurrentTranslateX(0); // 현재 드래그 오프셋 초기화
    
    // 애니메이션 종료 시 transition 속성 제거
    const onTransitionEnd = () => {
      if (containerRef.current) {
        containerRef.current.style.transition = "none";
        setIsAnimating(false);
        containerRef.current.removeEventListener('transitionend', onTransitionEnd);
      }
    };
    containerRef.current.addEventListener('transitionend', onTransitionEnd);

  }, []);

  // selectedDate 변경 시 중앙으로 부드럽게 이동
  useEffect(() => {
    // allDates가 변경될 때마다 다시 계산 및 애니메이션 실행 (generateContinuousDates의 의존성 때문에)
    const newAllDates = generateContinuousDates();
    const newSelectedDateIndex = newAllDates.findIndex(date => date.format("YYYY-MM-DD") === selectedDate);
    
    const centerTransform = calculateCenterTransform();
    animateToPosition(centerTransform);
  }, [selectedDate, calculateCenterTransform, animateToPosition, generateContinuousDates]); 

  // 가장 가까운 날짜로 스냅 (기존 로직 유지)
  const snapToNearestDate = useCallback(() => {
    const currentPosition = baseTranslateX + currentTranslateX;
    const screenCenter = SCREEN_WIDTH / 2;
    const approximateIndex = Math.round((screenCenter - currentPosition) / TOTAL_CARD_WIDTH);
    
    if (approximateIndex >= 0 && approximateIndex < allDates.length) {
      const targetDate = allDates[approximateIndex];
      if (targetDate) { // 유효한 날짜인지 확인
        // 스냅할 날짜의 인덱스에 해당하는 중앙 위치 계산
        const snappedIndex = allDates.findIndex(date => date.format("YYYY-MM-DD") === targetDate.format("YYYY-MM-DD"));
        const snappedCardCenterPos = snappedIndex * TOTAL_CARD_WIDTH + CARD_WIDTH / 2;
        const snappedTransform = screenCenter - snappedCardCenterPos;

        animateToPosition(snappedTransform); // 계산된 위치로 애니메이션
        onDateClick(targetDate.format("YYYY-MM-DD")); // 스냅된 날짜로 선택 날짜 업데이트
      }
    }
  }, [baseTranslateX, currentTranslateX, SCREEN_WIDTH, TOTAL_CARD_WIDTH, CARD_WIDTH, allDates, animateToPosition, onDateClick]); // calculateCenterTransform 의존성 제거, animateToPosition 의존성 추가

  // 날짜 클릭 핸들러 (기존 로직 유지)
  const handleDateClick = useCallback((dateStr: string) => {
    console.log("날짜 선택:", dateStr);
    localStorage.setItem("lastSelectedDate", dateStr);
    onDateClick(dateStr);
  }, [onDateClick]);

  // 터치 시작 (기존 로직 유지)
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

  // 터치 이동 (기존 로직 유지)
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

  // 터치 종료 (기존 로직 유지)
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

  // 마우스 이벤트 (기존 로직 유지)
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

  const hasPracticeRecord = useCallback((date: dayjs.Dayjs): boolean => {
    return practiceRecords.some(
      (record) => record.date === date.format("YYYY-MM-DD")
    );
  }, [practiceRecords]);

  return (
    <div 
      style={{
        width: "100%",
        maxWidth: 343,
        height: 56,
        margin: "15px auto 0 auto",
        overflow: "hidden",
        // ✅ 수정: touchAction을 pan-x로 변경하여 수평 스크롤 허용
        touchAction: "pan-x", 
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "grab",
        // ✅ 하드웨어 가속 활성화 (기존 유지)
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)"
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // 마우스가 벗어났을 때도 드래그 종료
    >
      <div
        ref={containerRef}
        style={{
          display: "flex",
          alignItems: "center",
          width: `${allDates.length * TOTAL_CARD_WIDTH}px`,
          // transform 속성은 animateToPosition에서 직접 설정
          transform: `translateX(${baseTranslateX + currentTranslateX}px)`,
          transition: isAnimating ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none", // isAnimating 상태에 따라 transition 적용
          // ✅ 부드러운 렌더링 최적화 (기존 유지)
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
          WebkitPerspective: 1000,
          perspective: 1000
        }}
      >
        {allDates.map((date, index) => {
          const dateStr = date.format("YYYY-MM-DD");
          const practiced = hasPracticeRecord(date); // practiceRecords 유효성 검사 제거
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isSunday = date.day() === 0;
          const isSaturday = date.day() === 6;
          const koreanHolidays = getKoreanHolidays(date.year());
          const isHoliday = koreanHolidays.includes(dateStr);
          
          // ✅ 연습 시간에 따른 색상 강도 (추가)
          const practiceMinutes = practiceRecords
                .filter(r => r && r.date === dateStr)
                .reduce((sum, r) => sum + (r.practiceTime || 0), 0);
          
          const practiceIntensity = Math.min(practiceMinutes / 60, 1);
          const borderColor = practiced 
            ? `rgba(69, 181, 170, ${0.6 + practiceIntensity * 0.4})`
            : "#9e9c98";
          
          return (
            <div
              key={dateStr} // ✅ key를 dateStr로 변경하여 안정적인 렌더링 보장 (index 사용 시 문제 발생 가능)
              style={{
                position: "relative",
              }}
            >
              {/* ✅ 월 경계 표시 (추가) */}
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
                  // 드래그 중이 아니거나, 애니메이션 중이 아닐 때만 클릭 처리
                  if (!('ontouchstart' in window) && !isDragging && !isAnimating && !hasMoved) { // hasMoved 조건 추가
                    handleDateClick(dateStr);
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // 부모의 드래그 핸들러로 이벤트 전파 방지
                  
                  // 터치 이동이 없었고, 드래그 중이 아니거나, 애니메이션 중이 아닐 때만 클릭 처리
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
                  // ✅ 크기 변화 없이 색상 강조만 (추가)
                  boxShadow: isSelected 
                    ? "inset 0 0 0 0.5px rgba(69, 181, 170, 0.5)"
                    : "none",
                  transition: isAnimating ? "none" : "box-shadow 0.15s ease", // isAnimating 시 transition 비활성화
                  zIndex: isSelected ? 5 : 1,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  // ✅ 안정적인 크기 유지 (추가)
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