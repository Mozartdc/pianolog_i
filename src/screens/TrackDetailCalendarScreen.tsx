import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ko";
import { Box, Badge, Button, Typography, Paper } from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import type { PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

type Track = { id: number; title: string; addedDate: string; completedDate?: string };
type PracticeChecks = { [date: string]: { [trackId: number]: boolean } };

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function toDateStr(date: Dayjs) {
  return date.format("YYYY-MM-DD");
}

// 커스텀 PickersDay: 곡이 있었던 날+미체크는 흐림, 없던 날은 거의 안 보이게(클린)
function CustomPickersDay(props: PickersDayProps & { checked?: boolean; existed?: boolean }) {
  const { checked, existed, ...other } = props;
  let opacity = 1;
  if (existed && !checked) opacity = 0.4;   // 곡이 있었는데 연습 안 한 날: 흐림
  if (!existed) opacity = 0.9;             // 곡이 없던 날: 거의 투명(클린)
  return (
    <Badge
      overlap="circular"
      badgeContent={checked ? "✔️" : undefined}
      color="success"
    >
      <PickersDay
        {...other}
        sx={{
          opacity,
          bgcolor: checked ? "#7e5fff" : existed ? "#bbb" : undefined,
          color: checked ? "#888" : existed ? "#888" : "#888",
          borderRadius: "50%",
        }}
      />
    </Badge>
  );
}

function TrackDetailCalendarScreen() {
  const query = useQuery();
  const trackId = Number(query.get("trackId"));
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>({});
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  useEffect(() => {
    const savedTracks = localStorage.getItem("tracks");
    setTracks(savedTracks ? JSON.parse(savedTracks) : []);
    const savedChecks = localStorage.getItem("practiceChecks");
    setPracticeChecks(savedChecks ? JSON.parse(savedChecks) : {});
  }, []);

  const track = tracks.find((t) => t.id === trackId);
  if (!track) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>곡 정보를 찾을 수 없습니다.</Typography>
        <Button onClick={() => navigate(-1)}>돌아가기</Button>
      </Box>
    );
  }

  // 날짜 클릭 시 체크/해제
  const handleDayClick = (date: Dayjs) => {
    const dateStr = toDateStr(date);
    const todayStr = toDateStr(dayjs());
    if (dateStr > todayStr) return; // 미래 날짜 클릭 불가

    // 1. 연습 체크/해제 처리
    setPracticeChecks((prev) => {
      const dayChecks = prev[dateStr] ? { ...prev[dateStr] } : {};
      dayChecks[trackId] = !dayChecks[trackId];
      const updated = { ...prev, [dateStr]: dayChecks };
      localStorage.setItem("practiceChecks", JSON.stringify(updated));
      return updated;
    });

    // 2. 곡의 addedDate보다 더 과거를 체크했다면, 곡의 addedDate를 갱신
    if (track.addedDate > dateStr) {
      const tracksRaw = localStorage.getItem("tracks");
      if (tracksRaw) {
        const tracksArr = JSON.parse(tracksRaw);
        const idx = tracksArr.findIndex((t: any) => t.id === trackId);
        if (idx !== -1) {
          tracksArr[idx].addedDate = dateStr;
          localStorage.setItem("tracks", JSON.stringify(tracksArr));
          setTracks(tracksArr); // 상태 동기화
        }
      }
    }

    setSelectedDate(date);
  };

  // slotProps.day에서 각 날짜별 checked, existed, disabled, onClick 등 커스텀
  const getDayProps = (date: Dayjs) => {
    const dateStr = toDateStr(date);
    const checked = !!(practiceChecks[dateStr] && practiceChecks[dateStr][trackId]);
    const isFuture = date.isAfter(dayjs(), "day");
    const existed =
      track.addedDate <= dateStr &&
      (!track.completedDate || dateStr <= track.completedDate);

    return {
      checked,
      existed,
      disabled: isFuture,
      onClick: () => !isFuture && handleDayClick(date),
    };
  };

  // "곡 완성" 버튼
  const handleComplete = () => {
    const today = toDateStr(dayjs());
    const updatedTracks = tracks.map(t =>
      t.id === trackId ? { ...t, completedDate: today } : t
    );
    setTracks(updatedTracks);
    localStorage.setItem("tracks", JSON.stringify(updatedTracks));
    alert("곡이 완성 처리되었습니다! 내일부터 리스트에 보이지 않습니다.");
    navigate(-1); // 트랙 화면으로 돌아가기
  };

  // 이미 완성된 곡인지 체크
  const isCompleted = !!track.completedDate;

  return (
    <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "#222", color: "#fff" }}>
      <Button
        variant="contained"
        onClick={() => navigate(-1)}
        sx={{
          mb: 2,
          bgcolor: "#333",
          color: "#fff",
          "&:hover": { bgcolor: "#444" },
        }}
      >
        ← 돌아가기
      </Button>
      <Typography variant="h4" mb={1}>
        곡별 연습 캘린더
      </Typography>
      <Typography variant="h6" mb={2}>
        {track.title}
      </Typography>
      <Paper
        sx={{
          bgcolor: "#181818",
          borderRadius: 2,
          p: 2,
          maxWidth: 400,
          mx: "auto",
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
         <StaticDatePicker
           displayStaticWrapperAs="desktop"
           value={selectedDate}
           onChange={(date) => date && setSelectedDate(date)}
           slots={{
           day: CustomPickersDay,
           actionBar: () => null, // ← OK/Cancel 완전 제거!
          }}
          slotProps={{
          day: (ownerState) => getDayProps(ownerState.day),
          }}
           disableFuture
         />
        </LocalizationProvider>
      </Paper>
      <Box sx={{ mt: 3, color: "#aaa", fontSize: 15 }}>
        <div>✔️: 연습 완료 / 흐림: 연습 안 함 / 미래 날짜: 클릭 불가</div>
        <div>날짜 클릭 시 체크/해제 (과거/오늘만 가능)</div>
        <div>
          캘린더에서 과거 날짜를 체크하면 곡의 시작일이 자동으로 조정되어 트랙 화면에도 반영됩니다.
        </div>
      </Box>
      {/* "곡 완성" 버튼 (이미 완성된 곡이면 비활성화) */}
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color={isCompleted ? "inherit" : "success"}
          onClick={handleComplete}
          disabled={isCompleted}
        >
          {isCompleted ? "이미 완성된 곡입니다" : "곡 완성"}
        </Button>
      </Box>
    </Box>
  );
}

export default TrackDetailCalendarScreen;
