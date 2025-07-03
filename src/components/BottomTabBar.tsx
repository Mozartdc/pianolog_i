import { useNavigate } from "react-router-dom";
import HomeIcon from "../assets/icons/home.svg?react";
import TodayIcon from "../assets/icons/today.svg?react";
import AppleIcon from "../assets/icons/apple.svg?react";
import StatisticIcon from "../assets/icons/statistic.svg?react";
import SettingIcon from "../assets/icons/setting.svg?react";

interface BottomTabBarProps {
  activeTab: "home" | "today" | "apple" | "statistic" | "setting";
  onTabChange: (tab: BottomTabBarProps["activeTab"]) => void;
}

const labels = {
  home: "홈",
  today: "투데이",
  apple: "전자사과",
  statistic: "통계",
  setting: "설정",
};

// CSS 변수로 변경
const activeColors = {
  home: "var(--TURQUOISE)",
  today: "var(--VERY_PERI)",
  apple: "var(--BLACK)",
  statistic: "var(--MIMOSA)",
  setting: "var(--VIVA_MAGENTA)"
};

const tabOrder: BottomTabBarProps["activeTab"][] = [
  "home",
  "today",
  "apple",
  "statistic",
  "setting",
];

// Routes와 일치하도록 수정
const tabToPath = {
  home: "/",
  today: "/today",
  apple: "/timer",        // Routes: /timer ✅
  statistic: "/stats",    // Routes: /stats ✅
  setting: "/settings",   // Routes: /settings ✅
};

const iconComponents = {
  home: HomeIcon,
  today: TodayIcon,
  apple: AppleIcon,
  statistic: StatisticIcon,
  setting: SettingIcon,
};

export default function BottomTabBar({ activeTab }: BottomTabBarProps) {
  const navigate = useNavigate();

  const handleTabChange = (tab: BottomTabBarProps["activeTab"]) => {
    navigate(tabToPath[tab]);
  };

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "100%", // ⭐ 이 부분을 "100%"로 변경했습니다.
        height: 78,
        background: "var(--bg-primary)",      // ✅ #fff → CSS 변수
        boxShadow: "0px 0px 0px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 100,
        padding: "0 16px",
        boxSizing: "border-box",
        fontFamily: "var(--FONT_FAMILY)"     // ✅ 폰트 통일
      }}
    >
      {tabOrder.map((tab) => {
        const Icon = iconComponents[tab];
        const isActive = activeTab === tab;
        const color = isActive ? activeColors[tab] : "var(--text-secondary)"; // ✅ #9E9C98 → CSS 변수
        
        return (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              width: 60,
              height: 44,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "var(--transition-fast)",  // ✅ all 0.2s → CSS 변수
              color: color,
              fontFamily: "var(--FONT_FAMILY)"      // ✅ 폰트 통일
            }}
            aria-current={isActive ? "page" : undefined}
            aria-label={labels[tab]}
          >
            <Icon 
              width={20}
              height={20}
              fill={color}
              style={{ color: color }}
            />
          </button>
        );
      })}
    </nav>
  );
}