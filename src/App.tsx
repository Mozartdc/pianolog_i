import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen";
import Today from "./screens/Today";
import RepeatCountScreen from "./screens/RepeatCountScreen";
import TodayCalendar from "./screens/TodayCalendar";
import PracticeSessionScreen from "./screens/PracticeSessionScreen";
import SettingsScreen from "./screens/SettingsScreen";
import StatsScreen from './screens/StatsScreen';
import StatsDayDetailScreen from './screens/StatsDayDetailScreen';

// 외부 BottomTabBar 컴포넌트 import
import BottomTabBar from "./components/BottomTabBar";

// URL을 activeTab으로 변환하는 함수
function getActiveTabFromPath(pathname: string): "home" | "today" | "apple" | "statistic" | "setting" {
  switch (pathname) {
    case "/": return "home";
    case "/today": return "today";
    case "/timer": return "apple";
    case "/stats": return "statistic";
    case "/settings": return "setting";
    case "/calendar": return "today";
    case "/practice": return "apple";
    default: return "home";
  }
}

function NavigationBar() {
  const location = useLocation();
  const activeTab = getActiveTabFromPath(location.pathname);

  const handleTabChange = () => {
    // React Router가 네비게이션을 처리하므로 빈 함수
  };

  return <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/today" element={<Today />} />
        <Route path="/timer" element={<RepeatCountScreen />} />
        <Route path="/calendar" element={<TodayCalendar />} />
        <Route path="/practice" element={<PracticeSessionScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/stats/:date" element={<StatsDayDetailScreen />} />
      </Routes>
      <NavigationBar />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* 🔴 이 div의 maxWidth를 "100%"로 변경하여 앱이 화면 너비에 맞춰 유연하게 확장되도록 합니다. */}
      <div style={{
        width: "100%",
        maxWidth: "100%", // ⭐ 이 부분을 "100%"로 변경했습니다.
        margin: "0 auto",
        paddingBottom: 80,
        minHeight: "100vh",
        background: "white",
        boxShadow: "none"
      }}>
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;