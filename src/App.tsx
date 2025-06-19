import React from "react";
import './chart-setup';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen";
import TrackScreen from "./screens/TrackScreen";
import RepeatCountScreen from "./screens/RepeatCountScreen";
import TrackDetailCalendarScreen from "./screens/TrackDetailCalendarScreen";
import PracticeSessionScreen from "./screens/PracticeSessionScreen";
import SettingsScreen from "./screens/SettingsScreen";
import StatsScreen from './screens/StatsScreen';
import StatsDayDetailScreen from './screens/StatsDayDetailScreen';
import "./App.css";

function BottomTab() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: "홈", path: "/" },
    { label: "트랙", path: "/track" },
    { label: "통계", path: "/stats" },
    { label: "전자사과", path: "/repeat" },
    { label: "설정", path: "/settings" },
  ];

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-around",
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#fafbfc",
        borderTop: "1px solid #ddd",
        padding: "8px 0",
        zIndex: 10,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          style={{
            background: "none",
            border: "none",
            fontWeight: location.pathname === tab.path ? "bold" : "normal",
            color: location.pathname === tab.path ? "#4b72c2" : "#333",
            fontSize: "1em",
            cursor: "pointer",
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

// 하단 푸터 컴포넌트 추가
function FooterWithLogo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 72,
        zIndex: 0,
        pointerEvents: "none",
        userSelect: "none",
        textAlign: "center",
      }}
    >
      <img
        src="/src/utils/img/logo.png"
        alt="digital piano gallery"
        style={{
          height: 150,
          maxWidth: 1000,
          width: "auto",
          objectFit: "contain",
          margin: 0,
          padding: 0,
          display: "block",
        }}
      />
      <span
        style={{
          color: "#bbb",
          fontSize: 16,
          letterSpacing: 1,
          fontWeight: 500,
          background: "rgba(255,255,255,0.8)",
          padding: "0 8px",
          borderRadius: 6,
          display: "inline-block",
          marginTop: "-30px",
          lineHeight: "1",
          verticalAlign: "top",
        }}
      >
        digital piano gallery
      </span>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/track" element={<TrackScreen />} />
        <Route path="/repeat" element={<RepeatCountScreen />} />
        <Route path="/calendar" element={<TrackDetailCalendarScreen />} />
        <Route path="/practice" element={<PracticeSessionScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/stats/:date" element={<StatsDayDetailScreen />} />
      </Routes>
      <BottomTab />
      <FooterWithLogo />
    </>
  );
}

function AppHeader() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #eee",
        zIndex: 100,
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 20,
        letterSpacing: 2,
        lineHeight: "56px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
      }}
    >
      디피갤 피출앱
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ paddingTop: 56, paddingBottom: 80, minHeight: "100vh" }}>
        <AppHeader />
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
