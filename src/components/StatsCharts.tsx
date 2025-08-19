// src/components/StatsCharts.tsx
import React from "react";
import dayjs from "dayjs";
import { getDynamicMaxAndTicks, calculateBarHeight } from "../utils/statsUtils";

interface WeekData {
  dates: dayjs.Dayjs[];
  timeData: number[];
  songData: number[];
  dateRange: string;
}

interface StatsChartsProps {
  weekData: WeekData;
  today: string;
  commonFontStyle: React.CSSProperties;
}

export const StatsCharts: React.FC<StatsChartsProps> = ({
  weekData,
  today,
  commonFontStyle
}) => {
  const { maxValue: timeMaxValue, ticks: timeTicks } = getDynamicMaxAndTicks(weekData.timeData, 'time');
  const { maxValue: songMaxValue, ticks: songTicks } = getDynamicMaxAndTicks(weekData.songData, 'songs');

  return (
    <div style={{ 
      display: "flex", 
      gap: "min(12px, 3vw)", 
      margin: "10px auto 0 auto", 
      width: "100%", 
      boxSizing: "border-box", 
      justifyContent: "space-between", 
      alignItems: "flex-start" 
    }}>
      {/* 주간 피출 시간 차트 */}
      <div style={{ 
        flex: 1, 
        minWidth: "calc(50% - min(12px, 3vw) / 2)", 
        height: 161, 
        padding: 10, 
        border: "var(--border-light)", 
        borderRadius: 5, 
        background: "var(--bg-primary)", 
        boxSizing: "border-box" 
      }}>
        <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 4, ...commonFontStyle }}>
          주간 피출 시간
        </div>
        <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 12, ...commonFontStyle }}>
          {weekData.dateRange}
        </div>
        
        <div style={{ display: "flex", height: 70, marginBottom: 8 }}>
          <div style={{ width: 25, height: 70, position: "relative", marginRight: 5, flexShrink: 0 }}>
            {timeTicks.map((hour, index) => (
              <div key={index} style={{ 
                position: "absolute", top: `${index * (100 / (timeTicks.length - 1))}%`, 
                transform: 'translateY(-50%)', left: 0, fontSize: 10, 
                color: "var(--text-secondary)", lineHeight: 1, ...commonFontStyle 
              }}>
                {hour}h
              </div>
            ))}
          </div>
          
          <div style={{ display: "flex", alignItems: "end", height: 70, flex: 1, minWidth: 0 }}>
            {weekData.timeData.map((value, index) => {
              const isToday = weekData.dates[index].format("YYYY-MM-DD") === today;
              const height = calculateBarHeight(value, timeMaxValue);
              return (
                <div key={index} style={{ 
                  flex: "1 1 0", height: height, 
                  backgroundColor: isToday ? "var(--MIMOSA)" : "var(--PASTEL_MIMOSA)", 
                  borderRadius: 2, marginRight: index < 6 ? 2 : 0, minWidth: 0 
                }} />
              );
            })}
          </div>
        </div>
        
        <div style={{ display: "flex", fontSize: 12, ...commonFontStyle }}>
          <div style={{ width: 30, flexShrink: 0 }} />
          <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
            {["m", "t", "w", "t", "f", "s", "s"].map((day, index) => (
              <div key={index} style={{ 
                flex: "1 1 0", textAlign: "center", 
                color: index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)", 
                marginRight: index < 6 ? 2 : 0, minWidth: 0 
              }}>
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 주간 연습 곡 차트 */}
      <div style={{ 
        flex: 1, minWidth: "calc(50% - min(12px, 3vw) / 2)", height: 161, 
        padding: 10, border: "var(--border-light)", borderRadius: 5, 
        background: "var(--bg-primary)", boxSizing: "border-box" 
      }}>
        <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 4, ...commonFontStyle }}>
          주간 연습 곡
        </div>
        <div style={{ fontSize: 12, color: "var(--text-primary)", marginBottom: 12, ...commonFontStyle }}>
          {weekData.dateRange}
        </div>
        
        <div style={{ display: "flex", height: 70, marginBottom: 8 }}>
          <div style={{ width: 25, height: 70, position: "relative", marginRight: 5, flexShrink: 0 }}>
            {songTicks.map((songs, index) => (
              <div key={index} style={{ 
                position: "absolute", top: `${index * (100 / (songTicks.length - 1))}%`, 
                transform: 'translateY(-50%)', left: 0, fontSize: 10, 
                color: "var(--text-secondary)", lineHeight: 1, ...commonFontStyle 
              }}>
                {songs}
              </div>
            ))}
          </div>
          
          <div style={{ display: "flex", alignItems: "end", height: 70, flex: 1, minWidth: 0 }}>
            {weekData.songData.map((value, index) => {
              const isToday = weekData.dates[index].format("YYYY-MM-DD") === today;
              const height = calculateBarHeight(value, songMaxValue);
              return (
                <div key={index} style={{ 
                  flex: "1 1 0", height: height, 
                  backgroundColor: isToday ? "var(--MIMOSA)" : "var(--PASTEL_MIMOSA)", 
                  borderRadius: 2, marginRight: index < 6 ? 2 : 0, minWidth: 0 
                }} />
              );
            })}
          </div>
        </div>
        
        <div style={{ display: "flex", fontSize: 12, ...commonFontStyle }}>
          <div style={{ width: 30, flexShrink: 0 }} />
          <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
            {["m", "t", "w", "t", "f", "s", "s"].map((day, index) => (
              <div key={index} style={{ 
                flex: "1 1 0", textAlign: "center", 
                color: index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)", 
                marginRight: index < 6 ? 2 : 0, minWidth: 0 
              }}>
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};