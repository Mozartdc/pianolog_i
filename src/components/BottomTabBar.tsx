import { useNavigate } from "react-router-dom";
import HomeIcon from "../assets/icons/home.svg?react";
import TodayIcon from "../assets/icons/today.svg?react";
import AppleIcon from "../assets/icons/apple.svg?react";
import StatisticIcon from "../assets/icons/statistic.svg?react";
import SettingIcon from "../assets/icons/setting.svg?react";
import "./BottomTabBar.css";

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

const activeColors = {
  home: "var(--TURQUOISE)",
  today: "var(--VERY_PERI)",
  apple: "var(--text-primary)",
  statistic: "var(--MIMOSA)",
  setting: "var(--VIVA_MAGENTA)"
};

const tabOrder: BottomTabBarProps["activeTab"][] = [
  "home", "today", "apple", "statistic", "setting",
];

const tabToPath = {
  home: "/",
  today: "/today",
  apple: "/timer",
  statistic: "/stats",
  setting: "/settings",
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
       height: `calc(93px + env(safe-area-inset-bottom))`
      }}
    >
      {tabOrder.map((tab) => {
        const Icon = iconComponents[tab];
        const isActive = activeTab === tab;
        const color = isActive ? activeColors[tab] : "var(--text-secondary)";
        
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