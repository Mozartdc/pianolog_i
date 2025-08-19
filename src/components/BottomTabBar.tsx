import { useNavigate } from "react-router-dom";
import { usePracticeData } from "../contexts/PracticeDataContext";
import HomeIcon from "../assets/icons/home.svg?react";
import TodayIcon from "../assets/icons/today.svg?react";
import AppleIcon from "../assets/icons/apple.svg?react";
import MetronomeIcon from "../assets/icons/metronome.svg?react";
import StatisticIcon from "../assets/icons/statistic.svg?react";
import SettingIcon from "../assets/icons/setting.svg?react";
import "./BottomTabBar.css";

interface BottomTabBarProps {
  activeTab: "home" | "today" | "apple" | "metronome" | "statistic" | "setting";
  onTabChange: (tab: BottomTabBarProps["activeTab"]) => void;
}

const labels = {
  home: "홈",
  today: "투데이",
  apple: "전자사과",
  metronome: "메트로놈",
  statistic: "통계",
  setting: "설정",
};

const activeColors = {
  home: "var(--TURQUOISE)",
  today: "var(--VERY_PERI)",
  apple: "var(--text-primary)",
  metronome: "var(--text-secondary)", // 항상 회색
  statistic: "var(--MIMOSA)",
  setting: "var(--VIVA_MAGENTA)"
};

const tabOrder: BottomTabBarProps["activeTab"][] = [
  "home", "today", "apple", "metronome", "statistic", "setting",
];

const tabToPath = {
  home: "/",
  today: "/today",
  apple: "/timer",
  metronome: "/metronome",
  statistic: "/stats",
  setting: "/settings",
};

const iconComponents = {
  home: HomeIcon,
  today: TodayIcon,
  apple: AppleIcon,
  metronome: MetronomeIcon,
  statistic: StatisticIcon,
  setting: SettingIcon,
};

export default function BottomTabBar({ activeTab }: BottomTabBarProps) {
  const navigate = useNavigate();
  const { timerActive, timerSeconds, timerRunning } = usePracticeData();

  const handleTabChange = (tab: BottomTabBarProps["activeTab"]) => {
    navigate(tabToPath[tab]);
  };

  // 🔧 타이머 시간 포맷팅 함수
  const formatTimerTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}h:${m.toString().padStart(2, '0')}m:${s.toString().padStart(2, '0')}`;
    } else {
      return `${m.toString().padStart(2, '0')}m:${s.toString().padStart(2, '0')}`;
    }
  };

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "100%",
        height: `calc(65px + env(safe-area-inset-bottom))`,
        padding: "0 16px",
        paddingBottom: `env(safe-area-inset-bottom)`,
        background: "var(--bg-primary)",
        boxShadow: "0px -4px 12px rgba(0, 0, 0, 0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingTop: '20px',
        boxSizing: "border-box",
        zIndex: 100,
      }}
    >
      {/* 🔧 타이머 표시 (홈 탭이 아닐 때만) - 스타일 수정 */}
      {timerActive && activeTab !== 'home' && (
        <div
          style={{
            position: 'absolute',
            top: '7px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '14px', 
            color: 'var(--LIVING_CORAL)', // 블랙으로 변경
            fontWeight: '400',
            fontFamily: 'var(--FONT_FAMILY)',
            whiteSpace: 'nowrap'
            // 테두리와 배경 제거
          }}
        >
          {formatTimerTime(timerSeconds)}
        </div>
      )}

      {tabOrder.map((tab) => {
        const Icon = iconComponents[tab];
        const isActive = activeTab === tab;
        
        // 🔧 메트로놈은 항상 비활성화 색상으로 표시
        const color = tab === 'metronome' 
          ? "var(--text-secondary)" 
          : (isActive ? activeColors[tab] : "var(--text-secondary)");
        
        return (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className="tab-button"
            style={{ color: color }}
            aria-current={isActive ? "page" : undefined}
            aria-label={labels[tab]}
          >
            <Icon className="tab-icon" />
            
          </button>
        );
      })}
    </nav>
  );
}