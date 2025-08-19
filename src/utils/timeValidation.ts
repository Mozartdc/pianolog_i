// src/utils/timeValidation.ts
import dayjs from 'dayjs';

export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
  durationMinutes?: number;
}

/**
 * 시간 설정의 유효성을 검사하는 통합 함수
 * @param startTimestamp 시작 시간 (밀리초)
 * @param endTimestamp 종료 시간 (밀리초)
 * @returns 검증 결과
 */
export function validateTimeSettings(startTimestamp: number, endTimestamp: number): TimeValidationResult {
  const now = Date.now();
  const oneMinuteLater = now + 60 * 1000; // 1분 여유시간
  
  console.log('🔍 시간 검증 시작:', {
    startTimestamp,
    endTimestamp,
    startFormatted: dayjs(startTimestamp).format('YYYY-MM-DD HH:mm:ss'),
    endFormatted: dayjs(endTimestamp).format('YYYY-MM-DD HH:mm:ss'),
    rawDuration: endTimestamp - startTimestamp
  });
  
  // 기본 순서 검증 (타임스탬프는 항상 양수여야 함)
  if (endTimestamp <= startTimestamp) {
    console.log('❌ 순서 검증 실패:', { startTimestamp, endTimestamp });
    return {
      isValid: false,
      error: "피퇴 시간은 피출 시간보다 나중이어야 합니다."
    };
  }

  // 미래 시간 검증
  if (startTimestamp > oneMinuteLater) {
    console.log('❌ 미래 피출시간 검증 실패');
    return {
      isValid: false,
      error: "피출 시간은 현재 시간보다 미래로 설정할 수 없습니다."
    };
  }

  if (endTimestamp > oneMinuteLater) {
    console.log('❌ 미래 피퇴시간 검증 실패');
    return {
      isValid: false,
      error: "피퇴 시간은 현재 시간보다 미래로 설정할 수 없습니다."
    };
  }

  // ✅ 개선된 기간 계산 (타임스탬프 기반으로 정확히 계산)
  const durationMilliseconds = endTimestamp - startTimestamp;
  const durationSeconds = Math.floor(durationMilliseconds / 1000);
  const durationMinutes = Math.floor(durationSeconds / 60);

  console.log('📊 기간 계산 결과:', {
    durationMilliseconds,
    durationSeconds,
    durationMinutes,
    durationFormatted: formatDuration(durationMinutes)
  });

  // 최소 시간 검증 (1분)
  if (durationSeconds < 60) {
    console.log('❌ 최소시간 검증 실패:', { durationSeconds });
    return {
      isValid: false,
      error: "연습 시간은 1분 이상이어야 합니다."
    };
  }

  // 과도한 과거 시간 검증 (1년 전보다 오래된 시간)
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  if (startTimestamp < oneYearAgo) {
    console.log('❌ 과거시간 검증 실패');
    return {
      isValid: false,
      error: "너무 오래된 시간입니다. 1년 이내의 시간만 설정 가능합니다."
    };
  }

  console.log('✅ 시간 검증 성공:', { durationMinutes });
  return {
    isValid: true,
    durationMinutes
  };
}

/**
 * 시간을 사용자 친화적 형식으로 포맷
 * @param minutes 분 단위 시간
 * @returns 포맷된 문자열
 */
export function formatDuration(minutes: number): string {
  if (minutes === 0) return "0분";
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return remainingMinutes > 0 
      ? `${hours}시간 ${remainingMinutes}분`
      : `${hours}시간`;
  }
  
  return `${remainingMinutes}분`;
}

/**
 * 디버깅용 시간 정보 로깅
 * @param label 로그 라벨
 * @param startTimestamp 시작 시간
 * @param endTimestamp 종료 시간
 */
export function logTimeInfo(label: string, startTimestamp: number, endTimestamp: number): void {
  const durationSeconds = (endTimestamp - startTimestamp) / 1000;
  const durationMinutes = Math.floor(durationSeconds / 60);
  
  console.log(`🕐 ${label}:`, {
    시작시간: dayjs(startTimestamp).format('YYYY-MM-DD HH:mm:ss'),
    종료시간: dayjs(endTimestamp).format('YYYY-MM-DD HH:mm:ss'),
    기간초: Math.floor(durationSeconds),
    기간분: durationMinutes,
    포맷된기간: formatDuration(durationMinutes),
    시작날짜: dayjs(startTimestamp).format('YYYY-MM-DD'),
    종료날짜: dayjs(endTimestamp).format('YYYY-MM-DD')
  });
}