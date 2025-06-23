import { useNavigate } from "react-router-dom";

// SVG를 일반 이미지 URL로 import
import HomeIcon from "../assets/icons/home.svg";
import TodayIcon from "../assets/icons/today.svg";
import AppleIcon from "../assets/icons/apple.svg";
import StatisticIcon from "../assets/icons/statistic.svg";
import SettingIcon from "../assets/icons/setting.svg";

interface BottomTabBarProps {
  activeTab: "home" | "today" | "apple" | "statistic" | "setting";
  onTabChange: (tab: BottomTabBarProps["activeTab"]) => void;
}

const icons = {
  home: HomeIcon,
  today: TodayIcon,
  apple: AppleIcon,
  statistic: StatisticIcon,
  setting: SettingIcon,
};

const labels = {
  home: "홈",
  today: "투데이",
  apple: "전자사과",
  statistic: "통계",
  setting: "설정",
};

const tabOrder: BottomTabBarProps["activeTab"][] = [
  "home",
  "today",
  "apple",
  "statistic",
  "setting",
];

// 탭과 경로 매핑
const tabToPath = {
  home: "/",
  today: "/track", 
  apple: "/timer",
  statistic: "/stats",
  setting: "/settings",
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
        const iconSrc = icons[tab];
        const isActive = activeTab === tab;
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
              color: isActive ? "#45B5AA" : "#9E9C98", // CSS color로 SVG 색상 제어
            }}
            aria-current={isActive ? "page" : undefined}
            aria-label={labels[tab]}
          >
            <img
              src={iconSrc}
              alt={labels[tab]}
              width={24}
              height={24}
              style={{
                // CSS filter 완전 제거, color 속성으로 제어
                transition: "color 0.2s",
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}
