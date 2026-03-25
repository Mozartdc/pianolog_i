import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Track, TrackRecording, usePracticeData } from "../contexts/PracticeDataContext";
import TrackRecordingsModal from "./TrackRecordingsModal";
import { getAudioDurationMs, saveRecordingBlob, getRecordingBlob, getMediaKindFromMimeType } from "../utils/recordingStorage";
import AudioFileIcon from "../assets/icons/audio file.svg?react";
import RecordIcon from "../assets/icons/rec.svg?react";
import RecordingIcon from "../assets/icons/recording.svg?react";
import CautionIcon from "../assets/icons/caution.svg?react";

interface TrackDetailModalProps {
  isOpen: boolean;
  trackId: number | null;
  onClose: () => void;
  onOpenCalendar: (trackId: number) => void;
}

type RecordingDraft = {
  id: string;
  archiveName: string;
  sourceType: "recorded" | "imported";
  mimeType: string;
  durationMs: number;
  blob: Blob;
};

type RecorderState = "idle" | "recording" | "fallback";

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatElapsed = (elapsedMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const sanitizeTrackTitle = (title: string) =>
  title.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();

const createArchiveName = (trackTitle: string) =>
  `${sanitizeTrackTitle(trackTitle)}_${dayjs().format("YYYY-MM-DD_HH-mm")}`;

const MIME_PRIORITY = ["audio/mp4", "audio/aac", "audio/webm"];

const getSupportedRecorderMimeType = () => {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }

  return MIME_PRIORITY.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
};

const RecordingMediaPreview: React.FC<{ recordingId: string; mimeType: string }> = ({ recordingId, mimeType }) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const mediaKind = getMediaKindFromMimeType(mimeType);

  useEffect(() => {
    let isMounted = true;
    let currentUrl: string | null = null;

    const load = async () => {
      const blob = await getRecordingBlob(recordingId);
      if (!blob || !isMounted) return;

      currentUrl = URL.createObjectURL(blob);
      setMediaUrl(currentUrl);
      setHasPlaybackError(false);
    };

    void load();

    return () => {
      isMounted = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [recordingId]);

  if (!mediaUrl) {
    return <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>미리보기 준비 중...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {mediaKind === "video" ? (
        <video
          controls
          preload="metadata"
          src={mediaUrl}
          style={{ width: "100%", maxHeight: 220, borderRadius: 8, background: "#000" }}
          onError={() => setHasPlaybackError(true)}
        />
      ) : (
        <audio
          controls
          preload="metadata"
          src={mediaUrl}
          style={{ width: "100%", height: 32 }}
          onError={() => setHasPlaybackError(true)}
        />
      )}
      {hasPlaybackError && (
        <div style={{ fontSize: 12, color: "var(--VIVA_MAGENTA)" }}>
          이 브라우저에서 재생할 수 없는 파일 형식입니다.
        </div>
      )}
    </div>
  );
};

const TrackDetailModal: React.FC<TrackDetailModalProps> = ({
  isOpen,
  trackId,
  onClose,
  onOpenCalendar
}) => {
  const HEATMAP_DAYS = 252;
  const {
    tracks,
    practiceChecks,
    practiceRecords,
    markTrackComplete,
    unmarkTrackComplete,
    trackRecordings,
    addTrackRecording
  } = usePracticeData();

  const [isRecordingsModalOpen, setIsRecordingsModalOpen] = useState(false);
  const [draft, setDraft] = useState<RecordingDraft | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [recordingBlinkOn, setRecordingBlinkOn] = useState(true);
  const recordingStartAtRef = useRef<number | null>(null);
  const recordingTickerRef = useRef<number | null>(null);
  const recordingBlinkTickerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);

  const track = trackId !== null ? tracks.find((item) => item.id === trackId) ?? null : null;

  const recordings = useMemo<TrackRecording[]>(
    () => (track ? trackRecordings.filter((recording) => recording.trackId === track.id) : []),
    [track, trackRecordings]
  );
  const sortedRecordings = useMemo(
    () => recordings.slice().sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
    [recordings]
  );

  const totalPracticeDays = useMemo(
    () =>
      track
        ? Object.keys(practiceChecks).filter((date) => practiceChecks[date]?.[track.id]).length
        : 0,
    [practiceChecks, track]
  );

  const latestPracticeDate = useMemo(() => {
    if (!track) return null;
    const dates = Object.keys(practiceChecks).filter((date) => practiceChecks[date]?.[track.id]);
    if (dates.length === 0) return null;
    const sortedDates = dates.sort();
    return sortedDates[sortedDates.length - 1] ?? null;
  }, [practiceChecks, track]);

  const recentHeatmap = useMemo(() => {
    if (!track) return [];

    return Array.from({ length: HEATMAP_DAYS }, (_, index) => {
      const date = dayjs().subtract(HEATMAP_DAYS - 1 - index, "day");
      const dateStr = date.format("YYYY-MM-DD");
      const isChecked = !!practiceChecks[dateStr]?.[track.id];
      const totalMinutes = practiceRecords
        .filter((record) => record.date === dateStr)
        .reduce((sum, record) => sum + Number(record.practiceTime || 0), 0);

      let level = 0;
      if (isChecked) {
        if (totalMinutes >= 120) level = 4;
        else if (totalMinutes >= 60) level = 3;
        else if (totalMinutes >= 30) level = 2;
        else level = 1;
      }

      return { key: dateStr, label: date.format("M/D"), level };
    });
  }, [HEATMAP_DAYS, practiceChecks, practiceRecords, track]);
  const trackHeatRows = 7;
  const trackDotSize = 8;
  const trackDotGap = 1;
  const trackWeekCount = Math.ceil(recentHeatmap.length / trackHeatRows);
  const trackHeatmapWidth = trackWeekCount * trackDotSize + (trackWeekCount - 1) * trackDotGap;
  const trackMonthLabels = useMemo(() => {
    const labels: { key: string; label: string; column: number }[] = [];
    let lastKey = "";
    recentHeatmap.forEach((cell, index) => {
      const monthKey = dayjs(cell.key).format("YYYY-MM");
      if (monthKey !== lastKey) {
        labels.push({
          key: monthKey,
          label: dayjs(cell.key).format("MMM"),
          column: Math.floor(index / trackHeatRows)
        });
        lastKey = monthKey;
      }
    });
    return labels;
  }, [recentHeatmap]);

  useEffect(() => {
    if (!isOpen) {
      mediaRecorderRef.current = null;
      mediaChunksRef.current = [];
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setIsRecordingsModalOpen(false);
      setDraft(null);
      setDraftNote("");
      setRecorderState("idle");
      setRecorderError(null);
      setRecordingElapsedMs(0);
      recordingStartAtRef.current = null;
      if (recordingTickerRef.current) {
        clearInterval(recordingTickerRef.current);
        recordingTickerRef.current = null;
      }
      if (recordingBlinkTickerRef.current) {
        clearInterval(recordingBlinkTickerRef.current);
        recordingBlinkTickerRef.current = null;
      }
      setRecordingBlinkOn(true);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current = null;
      mediaChunksRef.current = [];
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (recordingTickerRef.current) {
        clearInterval(recordingTickerRef.current);
        recordingTickerRef.current = null;
      }
      if (recordingBlinkTickerRef.current) {
        clearInterval(recordingBlinkTickerRef.current);
        recordingBlinkTickerRef.current = null;
      }
      recordingStartAtRef.current = null;
    };
  }, []);

  const createDraftFromBlob = async (
    blob: Blob,
    sourceType: "recorded" | "imported",
    fallbackMimeType: string
  ) => {
    if (!track) return;

    const durationMs = await getAudioDurationMs(blob);
    const recordingId = crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    setDraft({
      id: recordingId,
      archiveName: createArchiveName(track.title),
      sourceType,
      mimeType: blob.type || fallbackMimeType,
      durationMs,
      blob
    });
    setDraftNote("");
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    await createDraftFromBlob(file, "imported", "audio/mpeg");
    setRecorderError(null);
    setRecorderState("idle");
  };

  const handleRecordingFailure = (message: string) => {
    mediaRecorderRef.current = null;
    mediaChunksRef.current = [];
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setRecorderState("fallback");
    setRecorderError(message);
    setRecordingElapsedMs(0);
    recordingStartAtRef.current = null;
    if (recordingTickerRef.current) {
      clearInterval(recordingTickerRef.current);
      recordingTickerRef.current = null;
    }
    if (recordingBlinkTickerRef.current) {
      clearInterval(recordingBlinkTickerRef.current);
      recordingBlinkTickerRef.current = null;
    }
    setRecordingBlinkOn(true);
  };

  const handleStartRecording = async () => {
    setRecorderError(null);

    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function" ||
      typeof MediaRecorder === "undefined"
    ) {
      handleRecordingFailure("이 환경에서는 직접 녹음이 어려워요. 파일 선택으로 계속할 수 있어요.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        handleRecordingFailure("녹음을 진행할 수 없어요. 파일 선택으로 계속할 수 있어요.");
      };

      recorder.onstop = async () => {
        const recordedBlob = new Blob(mediaChunksRef.current, { type: mimeType || "audio/mp4" });
        mediaRecorderRef.current = null;
        mediaChunksRef.current = [];
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        setRecorderState("idle");
        if (recordingTickerRef.current) {
          clearInterval(recordingTickerRef.current);
          recordingTickerRef.current = null;
        }
        if (recordingBlinkTickerRef.current) {
          clearInterval(recordingBlinkTickerRef.current);
          recordingBlinkTickerRef.current = null;
        }
        recordingStartAtRef.current = null;
        setRecordingElapsedMs(0);
        setRecordingBlinkOn(true);
        await createDraftFromBlob(recordedBlob, "recorded", mimeType || "audio/mp4");
      };

      recorder.start();
      setRecorderState("recording");
      const startAt = Date.now();
      recordingStartAtRef.current = startAt;
      setRecordingElapsedMs(0);
      if (recordingTickerRef.current) {
        clearInterval(recordingTickerRef.current);
      }
      recordingTickerRef.current = window.setInterval(() => {
        if (!recordingStartAtRef.current) return;
        setRecordingElapsedMs(Date.now() - recordingStartAtRef.current);
      }, 200);
      if (recordingBlinkTickerRef.current) {
        clearInterval(recordingBlinkTickerRef.current);
      }
      setRecordingBlinkOn(true);
      recordingBlinkTickerRef.current = window.setInterval(() => {
        setRecordingBlinkOn((prev) => !prev);
      }, 650);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError") {
        handleRecordingFailure("마이크 권한이 없어 직접 녹음이 어려워요. 파일 선택으로 계속할 수 있어요.");
      } else {
        handleRecordingFailure("이 환경에서는 직접 녹음이 어려워요. 파일 선택으로 계속할 수 있어요.");
      }
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleSaveDraft = async () => {
    if (!track || !draft) return;

    await saveRecordingBlob(draft.id, draft.blob);
    addTrackRecording({
      id: draft.id,
      trackId: track.id,
      archiveName: draft.archiveName,
      createdAt: new Date().toISOString(),
      durationMs: draft.durationMs,
      note: draftNote.trim() || undefined,
      sourceType: draft.sourceType,
      mimeType: draft.mimeType
    });
    setDraft(null);
    setDraftNote("");
  };

  if (!isOpen || !track) return null;

  const practiceDaysSince = dayjs().diff(dayjs(track.addedDate), "day") + 1;
  const recentRecordings = sortedRecordings.slice(0, 3);

  const levelColors = [
    "#FFFFFF",
    "#fce2df",
    "#fce2df",
    "#f7a8a1",
    "#f36f63"
  ];

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--modal-backdrop)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: "calc(100% - 32px)",
            maxWidth: 420,
            maxHeight: "calc(100% - 48px)",
            overflowY: "auto",
            background: "var(--bg-primary)",
            border: "var(--border-light)",
            borderRadius: "var(--border-radius-small)",
            boxSizing: "border-box",
            padding: 18,
            boxShadow: "var(--modal-shadow)",
            display: "flex",
            flexDirection: "column",
            gap: 18
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, color: "var(--text-primary)" }}>{track.title}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                {practiceDaysSince}일째 연습 중
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ border: "none", background: "transparent", color: "var(--text-secondary)", fontSize: 14, cursor: "pointer" }}
            >
              닫기
            </button>
          </div>

          <section
            style={{
              border: "var(--border-light)",
              borderRadius: "var(--border-radius-medium)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 700 }}>곡 상태</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                  총 {totalPracticeDays}일 연습 · 마지막 연습 {latestPracticeDate ? dayjs(latestPracticeDate).format("M월 D일") : "없음"}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-primary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!track.completedDate}
                  onChange={(event) => {
                    if (event.target.checked) {
                      markTrackComplete(track.id, dayjs().format("YYYY-MM-DD"));
                    } else {
                      unmarkTrackComplete(track.id);
                    }
                  }}
                />
                곡 완성
              </label>
            </div>

            <div>
              <div style={{ fontSize: 14, color: "var(--text-primary)", marginBottom: 8 }}>최근 {HEATMAP_DAYS}일 기록</div>
              <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <div style={{ width: trackHeatmapWidth }}>
                  <div style={{ position: "relative", height: 14, marginBottom: 4 }}>
                    {trackMonthLabels.map((month) => (
                      <span
                        key={month.key}
                        style={{
                          position: "absolute",
                          left: month.column * (trackDotSize + trackDotGap),
                          fontSize: 9,
                          lineHeight: "14px",
                          color: "var(--text-secondary)"
                        }}
                      >
                        {month.label}
                      </span>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateRows: `repeat(${trackHeatRows}, ${trackDotSize}px)`,
                      gridAutoFlow: "column",
                      gridAutoColumns: `${trackDotSize}px`,
                      gap: trackDotGap,
                      width: trackHeatmapWidth
                    }}
                  >
                    {recentHeatmap.map((cell) => (
                      <div
                        key={cell.key}
                        title={cell.label}
                        style={{
                          width: trackDotSize,
                          height: trackDotSize,
                          borderRadius: 2,
                          background: levelColors[cell.level],
                          border: cell.level === 0 ? "1px solid rgba(0, 0, 0, 0.16)" : "none",
                          boxSizing: "border-box"
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>기준: 체크된 날의 전체 연습 시간</div>
                <button
                  type="button"
                  onClick={() => onOpenCalendar(track.id)}
                  style={{
                    border: "1px solid var(--VERY_PERI)",
                    background: "transparent",
                    color: "var(--VERY_PERI)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    borderRadius: "var(--border-radius-small)",
                    padding: "6px 10px"
                  }}
                >
                  캘린더 상세 보기
                </button>
              </div>
            </div>
          </section>

          <section
            style={{
              border: "var(--border-light)",
              borderRadius: "var(--border-radius-medium)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <div>
              <div style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 700 }}>녹음 기록</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                총 {recordings.length}개 · 마지막 녹음 {sortedRecordings[0] ? dayjs(sortedRecordings[0].createdAt).format("M월 D일 HH:mm") : "없음"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              {recorderState === "recording" ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    minHeight: 32,
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--VIVA_MAGENTA)"
                  }}
                >
                  <RecordingIcon
                    width="16"
                    height="16"
                    style={{
                      color: "var(--VIVA_MAGENTA)",
                      flexShrink: 0,
                      opacity: recordingBlinkOn ? 1 : 0.25,
                      transition: "opacity 220ms ease"
                    }}
                  />
                  <span>녹음중</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  style={{
                    border: "1px solid var(--VIVA_MAGENTA)",
                    borderRadius: "var(--border-radius-small)",
                    background: "transparent",
                    color: "var(--VIVA_MAGENTA)",
                    cursor: "pointer",
                    fontFamily: "var(--FONT_FAMILY)",
                    fontSize: 15,
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    minHeight: 32,
                    padding: "0 10px",
                    lineHeight: 1
                  }}
                >
                  <RecordIcon width="16" height="16" style={{ color: "var(--VIVA_MAGENTA)", flexShrink: 0 }} />
                  <span>REC</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "none",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontFamily: "var(--FONT_FAMILY)",
                  fontSize: 15,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: 0,
                  background: "transparent"
                }}
              >
                <AudioFileIcon width="16" height="16" style={{ color: "var(--text-primary)", flexShrink: 0 }} />
                <span>기존 파일 추가</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.mp4,.mov,.m4v,.webm,audio/*,video/*"
                style={{ display: "none" }}
                onChange={handleImportFile}
              />
            </div>

            {recorderState === "recording" && (
              <div
                style={{
                  width: "100%",
                  border: "var(--border-light)",
                  borderRadius: "999px",
                  padding: "8px 10px",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <button
                  type="button"
                  onClick={handleStopRecording}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: "var(--bg-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    padding: 0
                  }}
                  aria-label="녹음 정지"
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: "var(--text-secondary)"
                    }}
                  />
                </button>

                <div
                  style={{
                    flex: 1,
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.08)",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min((recordingElapsedMs / (60 * 60 * 1000)) * 100, 100)}%`,
                      height: "100%",
                      background: "var(--VERY_PERI)",
                      borderRadius: 999,
                      transition: "width 180ms linear"
                    }}
                  />
                </div>

                <div style={{ minWidth: 46, textAlign: "right", fontSize: 12, color: "var(--text-primary)" }}>
                  {formatElapsed(recordingElapsedMs)}
                </div>
              </div>
            )}

            {recorderError && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "var(--VIVA_MAGENTA)", lineHeight: 1.5 }}>
                <CautionIcon width="14" height="14" style={{ color: "var(--VIVA_MAGENTA)", flexShrink: 0, marginTop: 2 }} />
                <div>이 기기 브라우저에서는 직접 녹음이 막혀 있어요. 기존 파일 추가만 사용할 수 있어요.</div>
              </div>
            )}

            {recentRecordings.length === 0 ? (
              <div
                style={{
                  border: "1px solid var(--DARK_GRAY)",
                  borderRadius: "var(--border-radius-small)",
                  padding: "16px 14px",
                  boxSizing: "border-box",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: 13
                }}
              >
                아직 저장된 녹음이 없습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentRecordings.map((recording) => (
                  <div
                    key={recording.id}
                    style={{
                      border: "var(--border-light)",
                      borderRadius: "var(--border-radius-small)",
                      padding: 10,
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8
                    }}
                  >
                    <div style={{ fontSize: 12, color: "var(--text-primary)", wordBreak: "break-all" }}>{recording.archiveName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {dayjs(recording.createdAt).format("YYYY.MM.DD HH:mm")} · {formatDuration(recording.durationMs)}
                    </div>
                    <RecordingMediaPreview recordingId={recording.id} mimeType={recording.mimeType} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setIsRecordingsModalOpen(true)}
                style={{
                  border: "1px solid var(--VERY_PERI)",
                  background: "transparent",
                  color: "var(--VERY_PERI)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "var(--border-radius-small)",
                  padding: "6px 10px"
                }}
              >
                전체 녹음 보기
              </button>
            </div>
          </section>
        </div>
      </div>

      {draft && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1450
          }}
          onClick={() => {
            setDraft(null);
            setDraftNote("");
          }}
        >
          <div
            style={{
              width: "calc(100% - 40px)",
              maxWidth: 340,
              background: "var(--bg-primary)",
              border: "var(--border-light)",
              borderRadius: "var(--border-radius-small)",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ fontSize: 15, color: "var(--text-primary)" }}>녹음 저장</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, wordBreak: "break-all" }}>
                {draft.archiveName} · {formatDuration(draft.durationMs)}
              </div>
            </div>
            <textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              rows={4}
              placeholder="메모를 남기려면 입력하세요"
              style={{
                width: "100%",
                resize: "none",
                border: "1px solid var(--DARK_GRAY)",
                borderRadius: "var(--border-radius-small)",
                padding: 10,
                boxSizing: "border-box",
                fontFamily: "var(--FONT_FAMILY)",
                fontSize: 13,
                background: "transparent",
                color: "var(--text-primary)"
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setDraftNote("");
                }}
                style={{ flex: 1, height: 40, border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSaveDraft();
                }}
                style={{ flex: 1, height: 40, border: "none", background: "transparent", color: "var(--VERY_PERI)", cursor: "pointer" }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      <TrackRecordingsModal
        isOpen={isRecordingsModalOpen}
        track={track}
        recordings={sortedRecordings}
        onClose={() => setIsRecordingsModalOpen(false)}
      />
    </>
  );
};

export default TrackDetailModal;
