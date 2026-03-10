// src/utils/timeValidation.ts
import dayjs from 'dayjs';

export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
  durationMinutes?: number;
}

/**
 * Checks if the time settings are valid
 * @param startTimestamp Start time (in milliseconds)
 * @param endTimestamp End time (in milliseconds)
 * @returns Validation result
 */
export function validateTimeSettings(startTimestamp: number, endTimestamp: number): TimeValidationResult {
  const now = Date.now();
  const oneMinuteLater = now + 60 * 1000; // 1 minute buffer
  
  console.log('🔍 Starting time validation:', {
    startTimestamp,
    endTimestamp,
    startFormatted: dayjs(startTimestamp).format('YYYY-MM-DD HH:mm:ss'),
    endFormatted: dayjs(endTimestamp).format('YYYY-MM-DD HH:mm:ss'),
    rawDuration: endTimestamp - startTimestamp
  });
  
  // Basic order check (timestamps should always be positive)
  if (endTimestamp <= startTimestamp) {
    console.log('❌ Order validation failed:', { startTimestamp, endTimestamp });
    return {
      isValid: false,
      error: "피퇴 시간은 피출 시간보다 나중이어야 합니다."
    };
  }

  // Future time check
  if (startTimestamp > oneMinuteLater) {
    console.log('❌ Future start time validation failed');
    return {
      isValid: false,
      error: "피출 시간은 현재 시간보다 미래로 설정할 수 없습니다."
    };
  }

  if (endTimestamp > oneMinuteLater) {
    console.log('❌ Future end time validation failed');
    return {
      isValid: false,
      error: "피퇴 시간은 현재 시간보다 미래로 설정할 수 없습니다."
    };
  }

  // ✅ Better duration calculation (calculated precisely based on timestamps)
  const durationMilliseconds = endTimestamp - startTimestamp;
  const durationSeconds = Math.floor(durationMilliseconds / 1000);
  const durationMinutes = Math.floor(durationSeconds / 60);

  console.log('📊 Duration calculation result:', {
    durationMilliseconds,
    durationSeconds,
    durationMinutes,
    durationFormatted: formatDuration(durationMinutes)
  });

  // Minimum time check (1 minute)
  if (durationSeconds < 60) {
    console.log('❌ Minimum time validation failed:', { durationSeconds });
    return {
      isValid: false,
      error: "연습 시간은 1분 이상이어야 합니다."
    };
  }

  // Too far in the past check (older than 1 year)
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  if (startTimestamp < oneYearAgo) {
    console.log('❌ Past time validation failed');
    return {
      isValid: false,
      error: "너무 오래된 시간입니다. 1년 이내의 시간만 설정 가능합니다."
    };
  }

  console.log('✅ Time validation successful:', { durationMinutes });
  return {
    isValid: true,
    durationMinutes
  };
}

/**
 * Formats time in a user-friendly way
 * @param minutes Time in minutes
 * @returns Formatted string
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
 * Logs time info for debugging
 * @param label Log label
 * @param startTimestamp Start time
 * @param endTimestamp End time
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