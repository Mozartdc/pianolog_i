// src/components/StatsCharts.tsx
import React from "react";
import dayjs from "dayjs";

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
  timeSummary: string;
  songSummary: string;
}

export const StatsCharts: React.FC<StatsChartsProps> = ({
  weekData,
  today,
  commonFontStyle,
  timeSummary,
  songSummary
}) => {
  const chartWidth = 320;
  const chartHeight = 92;
  const horizontalPadding = 16;
  const verticalPadding = 12;
  const stepX = (chartWidth - horizontalPadding * 2) / Math.max(weekData.timeData.length - 1, 1);

  const buildPoints = (values: number[]) => {
    const maxValue = Math.max(...values, 1);
    return values.map((value, index) => {
      const x = horizontalPadding + stepX * index;
      const y = chartHeight - verticalPadding - ((value / maxValue) * (chartHeight - verticalPadding * 2));
      return { x, y };
    });
  };

  const renderChart = (values: number[], accentColor: string) => {
    const points = buildPoints(values);
    const polylinePoints = points.map(point => `${point.x},${point.y}`).join(" ");

    return (
      <>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: "100%", height: 120, display: "block", overflow: "visible" }}
        >
          {[0, 0.5, 1].map((ratio, index) => {
            const y = chartHeight - verticalPadding - ratio * (chartHeight - verticalPadding * 2);
            return (
              <line
                key={index}
                x1={horizontalPadding}
                y1={y}
                x2={chartWidth - horizontalPadding}
                y2={y}
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="1"
              />
            );
          })}

          <polyline
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polylinePoints}
          />

          {points.map((point, index) => {
            const isTodayPoint = weekData.dates[index].format("YYYY-MM-DD") === today;
            return (
              <circle
                key={weekData.dates[index].format("YYYY-MM-DD")}
                cx={point.x}
                cy={point.y}
                r={isTodayPoint ? 4.5 : 3.5}
                fill={isTodayPoint ? accentColor : "var(--bg-primary)"}
                stroke={isTodayPoint ? "var(--text-primary)" : accentColor}
                strokeWidth={isTodayPoint ? 1.5 : 1.5}
              />
            );
          })}
        </svg>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 2 }}>
          {["m", "t", "w", "t", "f", "s", "s"].map((day, index) => (
            <div
              key={`${day}-${index}`}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 12,
                color: index === 6 ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)",
                ...commonFontStyle
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div style={{
      display: "flex",
      gap: "min(12px, 3vw)",
      margin: "12px auto 0 auto",
      width: "100%",
      boxSizing: "border-box",
      alignItems: "stretch"
    }}>
      <div style={{
        flex: 1,
        minWidth: 0,
        padding: "12px 12px 16px",
        border: "var(--border-light)",
        borderRadius: 5,
        background: "var(--bg-primary)",
        boxSizing: "border-box"
      }}>
        <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 700, marginBottom: 4, ...commonFontStyle }}>
          주간 피출 시간
        </div>
        <div style={{ fontSize: 12, color: "var(--MIMOSA)", marginBottom: 2, ...commonFontStyle }}>
          {timeSummary}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10, ...commonFontStyle }}>
          {weekData.dateRange}
        </div>
        {renderChart(weekData.timeData, "var(--MIMOSA)")}
      </div>

      <div style={{
        flex: 1,
        minWidth: 0,
        padding: "12px 12px 16px",
        border: "var(--border-light)",
        borderRadius: 5,
        background: "var(--bg-primary)",
        boxSizing: "border-box"
      }}>
        <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 700, marginBottom: 4, ...commonFontStyle }}>
          주간 연습 곡 수
        </div>
        <div style={{ fontSize: 12, color: "var(--TURQUOISE)", marginBottom: 2, ...commonFontStyle }}>
          {songSummary}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10, ...commonFontStyle }}>
          {weekData.dateRange}
        </div>
        {renderChart(weekData.songData, "var(--TURQUOISE)")}
      </div>
    </div>
  );
};
