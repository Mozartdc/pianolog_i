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
    { label: "투데이", path: "/track" },
    { label: "타이머", path: "/timer" },
    { label: "통계", path: "/stats" },
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
            color: location.pathname === tab.path ? "#45b5aa" : "#333",
            fontSize: "12px",
            cursor: "pointer",
            padding: "4px 8px",
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/track" element={<TrackScreen />} />
        <Route path="/timer" element={<RepeatCountScreen />} />
        <Route path="/calendar" element={<TrackDetailCalendarScreen />} />
        <Route path="/practice" element={<PracticeSessionScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/stats/:date" element={<StatsDayDetailScreen />} />
      </Routes>
      <BottomTab />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ paddingBottom: 80, minHeight: "100vh" }}>
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
