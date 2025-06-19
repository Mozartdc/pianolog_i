import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";

type Track = { id: number; title: string; addedDate: string };
type PartialCounts = { [key: string]: number }; // key: trackId(숫자) or "Piano"

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function RepeatCountScreen() {
  const query = useQuery();
  const trackIdParam = query.get("trackId");
  const trackId = trackIdParam ? Number(trackIdParam) : null;
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [partialCounts, setPartialCounts] = useState<PartialCounts>({});
  const [count, setCount] = useState(0);

  // 곡 정보 불러오기
  useEffect(() => {
    const savedTracks = localStorage.getItem("tracks");
    setTracks(savedTracks ? JSON.parse(savedTracks) : []);
    const savedCounts = localStorage.getItem("partialCounts");
    setPartialCounts(savedCounts ? JSON.parse(savedCounts) : {});
  }, []);

  // 곡 정보 찾기
  const track = trackId !== null
    ? tracks.find((t) => t.id === trackId)
    : null;

  // 곡명: 곡이 있으면 곡명, 없으면 Piano
  const displayTitle = track ? track.title : "Piano";
  // 카운트 키: trackId 있으면 trackId, 없으면 "Piano"
  const countKey = trackId !== null && track ? String(trackId) : "Piano";

  // 카운트 동기화
  useEffect(() => {
    setCount(partialCounts[countKey] || 0);
    // eslint-disable-next-line
  }, [partialCounts, countKey]);

  // +1 (화면 아무데나 클릭)
  const handlePlus = () => {
    const newCount = count + 1;
    setCount(newCount);
    const updated = { ...partialCounts, [countKey]: newCount };
    setPartialCounts(updated);
    localStorage.setItem("partialCounts", JSON.stringify(updated));
  };

  // -1 (하단 버튼)
  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCount = Math.max(count - 1, 0);
    setCount(newCount);
    const updated = { ...partialCounts, [countKey]: newCount };
    setPartialCounts(updated);
    localStorage.setItem("partialCounts", JSON.stringify(updated));
  };

  // 리셋 (하단 버튼)
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCount(0);
    const updated = { ...partialCounts, [countKey]: 0 };
    setPartialCounts(updated);
    localStorage.setItem("partialCounts", JSON.stringify(updated));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fff",
        color: "#222",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "relative",
        touchAction: "manipulation",
      }}
      onClick={handlePlus}
    >
      {/* 상단 뒤로가기 버튼 */}
      <Box sx={{ position: "absolute", top: 24, left: 16 }}>
        <Button
          variant="text"
          onClick={(e) => {
            e.stopPropagation();
            navigate(-1);
          }}
          sx={{ color: "#888", fontSize: 18 }}
        >
          &lt; 뒤로
        </Button>
      </Box>
      {/* 중앙 곡명 + practice + 숫자 */}
      <Box
        sx={{
          mt: 12,
          mb: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          userSelect: "none",
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, mb: 0.5, fontSize: 28, letterSpacing: "0.01em" }}
        >
          {displayTitle}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: "#888", mb: 1, fontSize: 22 }}
        >
          practice
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 700,
            fontSize: "7rem",
            letterSpacing: "0.1em",
            mb: 1,
          }}
        >
          {count}
        </Typography>
      </Box>
      {/* 하단 버튼 */}
      <Box
        sx={{
          position: "absolute",
          bottom: 40,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={handleMinus}
          sx={{
            minWidth: 48,
            fontSize: 28,
            color: "#888",
            borderColor: "#ccc",
            borderRadius: 2,
          }}
        >
          –
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleReset}
          sx={{
            minWidth: 48,
            color: "#888",
            borderColor: "#ccc",
            borderRadius: 2,
            fontSize: 18,
            ml: 2,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
          startIcon={<ReplayIcon />}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
}

export default RepeatCountScreen;
