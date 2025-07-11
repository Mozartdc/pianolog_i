// src/App.tsx

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import HomeScreen from "./screens/HomeScreen";
import Today from "./screens/Today";
import RepeatCountScreen from "./screens/RepeatCountScreen";
import TodayCalendar from "./screens/TodayCalendar";
import PracticeSessionScreen from "./screens/PracticeSessionScreen";
import SettingsScreen from "./screens/SettingsScreen";
import StatsScreen from './screens/StatsScreen';
import BottomTabBar from "./components/BottomTabBar";
import { PracticeDataProvider } from "./contexts/PracticeDataContext";

// ✅ Theme 타입을 App.tsx에서도 사용
type Theme = "light" | "dark" | "system";

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
  return <BottomTabBar activeTab={activeTab} onTabChange={() => {}} />;
}

// ✅ props를 전달받도록 AppRoutes 수정
function AppRoutes({ theme, handleThemeChange }: { theme: Theme, handleThemeChange: (theme: Theme) => void }) {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/today" element={<Today />} />
        <Route path="/timer" element={<RepeatCountScreen />} />
        <Route path="/calendar" element={<TodayCalendar />} />
        <Route path="/practice" element={<PracticeSessionScreen />} />
        {/* ✅ SettingsScreen에 theme 상태와 핸들러를 props로 전달 */}
        <Route path="/settings" element={<SettingsScreen theme={theme} handleThemeChange={handleThemeChange} />} />
        <Route path="/stats" element={<StatsScreen />} />
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
  
  // ✅ 테마를 변경하는 핸들러 함수를 App 컴포넌트에 정의
  const handleThemeChange = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
  };

return (
    <BrowserRouter>
      <PracticeDataProvider>
        <div style={{
          width: "100%",
          maxWidth: "100%",
          margin: "0 auto",
          paddingBottom: 80,
          minHeight: "calc(var(--vh, 1vh) * 100)",
          background: "var(--bg-primary)",
          boxShadow: "none"
        }}>
          <AppRoutes theme={theme} handleThemeChange={handleThemeChange} />
        </div>
      </PracticeDataProvider>
    </BrowserRouter>
  );
}

export default App;