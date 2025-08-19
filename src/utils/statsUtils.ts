// src/utils/statsUtils.ts
import dayjs from "dayjs";
import type { PracticeRecord, PracticeChecks } from "../contexts/PracticeDataContext";

export interface SessionData {
  id: string;
  sessionNumber: number;
  duration: string;
  timeRange: string;
  minutes: number;
  memo?: string;
}

export const getKoreanHolidays = (year: number): string[] => {
  const holidays = [
    `${year}-01-01`, `${year}-03-01`, `${year}-05-05`, `${year}-06-06`,
    `${year}-08-15`, `${year}-10-03`, `${year}-10-09`, `${year}-12-25`,
  ];
  if (year === 2025) {
    holidays.push('2025-01-28', '2025-01-29', '2025-01-30', '2025-05-13', '2025-09-06', '2025-09-07', '2025-09-08');
  }
  return holidays;
};

export const getWeekData = (dateStr: string, practiceRecords: PracticeRecord[], practiceChecks: PracticeChecks) => {
  const date = dayjs(dateStr);
  const dayOfWeek = date.day();
  const diff = (dayOfWeek + 6) % 7;
  const startOfWeek = date.subtract(diff, "day");
  const weekDates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
  
  const timeData = weekDates.map(d => {
    const dayRecords = practiceRecords.filter(r => r.date === d.format("YYYY-MM-DD"));
    return dayRecords.reduce((sum, r) => sum + (r.practiceTime || 0), 0) / 60;
  });
  
  const songData = weekDates.map(d => {
    const checks = practiceChecks[d.format("YYYY-MM-DD")];
    return checks ? Object.values(checks).filter(Boolean).length : 0;
  });
  
  return { 
    dates: weekDates, 
    timeData, 
    songData, 
    dateRange: `${startOfWeek.format("MMM DD")} - ${startOfWeek.add(6, 'day').format("MMM DD")}` 
  };
};

export const getDynamicMaxAndTicks = (data: number[], type: 'time' | 'songs') => {
  const actualMax = Math.max(...data, 0);
  let displayMax = 5;
  if (actualMax > 5) {
    displayMax = Math.ceil(actualMax / 5) * 5;
  }
  const ticks = Array.from({ length: 6 }, (_, i) => displayMax - (i * (displayMax / 5)));
  const formattedTicks = ticks.map(tick => type === 'time' ? parseFloat(tick.toFixed(1)) : Math.round(tick));
  return { maxValue: displayMax, ticks: formattedTicks };
};

export const calculateBarHeight = (value: number, maxValue: number) => {
  const MAX_HEIGHT = 70;
  const MIN_HEIGHT = 2;
  if (maxValue === 0 || value === 0) return MIN_HEIGHT;
  const ratio = value / maxValue;
  return Math.max(MIN_HEIGHT, Math.min(ratio * MAX_HEIGHT, MAX_HEIGHT));
};

export const generateCalendarDays = (currentMonth: dayjs.Dayjs) => {
  let startOfMonth = currentMonth.startOf('month');
  const dayOfWeek = startOfMonth.day();
  const diff = (dayOfWeek + 6) % 7;
  startOfMonth = startOfMonth.subtract(diff, 'day');

  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(startOfMonth.add(i, 'day'));
  }
  return days;
};