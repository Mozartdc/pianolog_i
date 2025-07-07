import { useNavigate } from "react-router-dom";
import HomeIcon from "../assets/icons/home.svg?react";
import TodayIcon from "../assets/icons/today.svg?react";
import AppleIcon from "../assets/icons/apple.svg?react";
import StatisticIcon from "../assets/icons/statistic.svg?react";
import SettingIcon from "../assets/icons/setting.svg?react";
import "./BottomTabBar.css"; // ✅ CSS 파일 임포트

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
  apple: "var(--text-primary)", // ✅ --BLACK 대신 의미적 변수 사용
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
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "100%",
        height: 78,
        background: "var(--bg-primary)",
        boxShadow: "0px -4px 12px rgba(0, 0, 0, 0.05)", // 상단 그림자 효과
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 100,
        padding: "0 16px",
        boxSizing: "border-box",
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
            className="tab-button" // ✅ CSS 클래스 적용
            style={{ color: color }} // ✅ 글자색과 아이콘 색상을 여기서 한번에 제어
            aria-current={isActive ? "page" : undefined}
            aria-label={labels[tab]}
          >
            <Icon className="tab-icon" /> {/* ✅ 아이콘 크기는 CSS로 제어 */}
            
            {/* ✅ 아이콘 아래에 텍스트 라벨 추가 */}
            <span style={{ fontSize: 10 }}> 
              {labels[tab]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}