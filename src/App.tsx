// src/App.tsx

import { Routes, Route, useLocation } from "react-router-dom"; // BrowserRouter 제거
import { useState, useEffect } from "react";
import HomeScreen from "./screens/HomeScreen";
import Today from "./screens/Today";
import RepeatCountScreen from "./screens/RepeatCountScreen";
//import TodayCalendar from "./screens/TodayCalendar";
import PracticeSessionScreen from "./screens/PracticeSessionScreen";
import SettingsScreen from "./screens/SettingsScreen";
import StatsScreen from './screens/StatsScreen';
import BottomTabBar from "./components/BottomTabBar";
import { PracticeDataProvider } from "./contexts/PracticeDataContext";
import Metronome from './screens/Metronome';
// import FirstTimeSyncModal from './components/FirstTimeSyncModal'; // FirstTimeSync
// FirstTimeSyncModal import 제거

// Theme 타입 정의
type Theme = "light" | "dark" | "system";

function getActiveTabFromPath(pathname: string): "home" | "today" | "apple" | "metronome" | "statistic" | "setting" {
  switch (pathname) {
    case "/": return "home";
    case "/today": return "today";
    case "/timer": return "apple";
    case "/metronome": return "metronome"; // 👈 이거 추가
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
  return <BottomTabBar activeTab={activeTab} onTabChange={() => {}} />;
}

// props를 전달받도록 AppRoutes 수정
function AppRoutes({ theme, handleThemeChange }: { theme: Theme, handleThemeChange: (theme: Theme) => void }) {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/today" element={<Today />} />
        <Route path="/timer" element={<RepeatCountScreen />} />
        <Route path="/practice" element={<PracticeSessionScreen />} />
        <Route path="/settings" element={<SettingsScreen theme={theme} handleThemeChange={handleThemeChange} />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/metronome" element={<Metronome />} />
      </Routes>
      <NavigationBar />
    </>
  );
}

function isValidTheme(theme: any): theme is Theme {
    return theme === "light" || theme === "dark" || theme === "system";
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return isValidTheme(savedTheme) ? savedTheme : "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    const themeColorMeta = document.querySelector("#theme-color-meta");

    const applyTheme = (themeValue: "light" | "dark") => {
      root.dataset.theme = themeValue;
      const newThemeColor = themeValue === 'dark' ? '#1A1A1A' : '#ffffff';
      themeColorMeta?.setAttribute('content', newThemeColor);
    };

    if (theme === "system") {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(prefersDarkMode.matches ? 'dark' : 'light');
      const systemThemeListener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      prefersDarkMode.addEventListener('change', systemThemeListener);
      return () => prefersDarkMode.removeEventListener('change', systemThemeListener);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    const setRealHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setRealHeight();
    window.addEventListener('resize', setRealHeight);
    return () => window.removeEventListener('resize', setRealHeight);
  }, []);
  
  // 테마를 변경하는 핸들러 함수
  const handleThemeChange = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
  };

  return (
    <PracticeDataProvider>
      <div style={{
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        paddingBottom: 80,
        minHeight: "100dvh",
        background: "var(--bg-primary)",
        boxShadow: "none"
      }}>
        {/* FirstTimeSyncModal 제거 */}
        
        {/* BrowserRouter 제거하고 AppRoutes만 렌더링 */}
        <AppRoutes theme={theme} handleThemeChange={handleThemeChange} />
      </div>
    </PracticeDataProvider>
  );
}

export default App;