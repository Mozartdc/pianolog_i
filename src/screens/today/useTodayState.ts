import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePracticeData } from "../../contexts/PracticeDataContext";
import { buildTodayTrackViewModels } from "./todayDomain";

export function useTodayState() {
  const navigate = useNavigate();
  const {
    selectedDate,
    setSelectedDate,
    tracks,
    practiceRecords,
    practiceChecks,
    partialCounts,
    addTrack,
    removeTrack,
    updateTrackTitle,
    toggleCheck,
    incPartial,
    decPartial,
  } = usePracticeData();

  const [showSongPlusModal, setShowSongPlusModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showTrackDetailModal, setShowTrackDetailModal] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  const todayTrackRows = buildTodayTrackViewModels({
    tracks,
    selectedDate,
    practiceChecks,
    partialCounts,
  });

  const handleEdit = (id: number, newTitle: string) => {
    updateTrackTitle(id, newTitle);
  };

  const handleDelete = (id: number) => {
    if (confirm("정말 삭제하시겠습니까?")) removeTrack(id);
  };

  const handleTitleClick = (trackId: number) => {
    setSelectedTrackId(trackId);
    setShowTrackDetailModal(true);
  };

  const handleOpenCalendarDetail = (trackId: number) => {
    setSelectedTrackId(trackId);
    setShowTrackDetailModal(false);
    setShowCalendarModal(true);
  };

  const handleCountClick = (trackId: number) => {
    navigate(`/timer?trackId=${trackId}`);
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handlePracticeUpdate = () => {
    // No longer needed since we're using Context
  };

  return {
    selectedDate,
    showSongPlusModal,
    showCalendarModal,
    showTrackDetailModal,
    selectedTrackId,
    todayTrackRows,
    practiceRecords,
    practiceChecks,
    addTrack,
    toggleCheck,
    incPartial,
    decPartial,
    setShowSongPlusModal,
    setShowCalendarModal,
    setShowTrackDetailModal,
    setSelectedTrackId,
    handleEdit,
    handleDelete,
    handleTitleClick,
    handleOpenCalendarDetail,
    handleCountClick,
    handleDateClick,
    handlePracticeUpdate,
  };
}
