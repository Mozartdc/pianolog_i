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

const activeColors = {
  home: "#45B5AA",
  today: "#6667AB",
  apple: "#2D2D2A",
  statistic: "#F0C05A",
  setting: "#BB2649"
};

const tabOrder: BottomTabBarProps["activeTab"][] = [
  "home",
  "today",
  "apple",
  "statistic",
  "setting",
];

const tabToPath = {
  home: "/",
  today: "/today",  // ✅ 수정: /track → /today
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
        position: "fixed",
        bottom: 0,
        left: 0,
        width: 375,
        height: 78,
        background: "#fff",
        boxShadow: "0px 0px 0px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 100,
      }}
    >
      {tabOrder.map((tab) => {
        const Icon = iconComponents[tab];
        const isActive = activeTab === tab;
        const color = isActive ? activeColors[tab] : "#9E9C98";
        
        return (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              width: 76,
              height: 44,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.2s",
              color: color,
            }}
            aria-current={isActive ? "page" : undefined}
            aria-label={labels[tab]}
          >
            <Icon 
              width={24} 
              height={24} 
              fill={color}
              style={{ color: color }}
            />
          </button>
        );
      })}
    </nav>
  );
}
