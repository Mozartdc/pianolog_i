import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Track, TrackRecording, usePracticeData } from "../contexts/PracticeDataContext";
import { getRecordingBlob, getMediaKindFromMimeType } from "../utils/recordingStorage";

interface TrackRecordingsModalProps {
  isOpen: boolean;
  track: Track | null;
  recordings: TrackRecording[];
  onClose: () => void;
}

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
    return <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>미리보기 로딩 중...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {mediaKind === "video" ? (
        <video
          controls
          preload="metadata"
          src={mediaUrl}
          style={{ width: "100%", maxHeight: 240, borderRadius: 8, background: "#000" }}
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

const TrackRecordingsModal: React.FC<TrackRecordingsModalProps> = ({
  isOpen,
  track,
  recordings,
  onClose
}) => {
  const { removeTrackRecording, updateTrackRecordingNote } = usePracticeData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setDraftNote("");
    }
  }, [isOpen]);

  const sortedRecordings = useMemo(
    () => [...recordings].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
    [recordings]
  );

  if (!isOpen || !track) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--modal-backdrop)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "calc(100% - 32px)",
          maxWidth: 420,
          maxHeight: "calc(100% - 64px)",
          overflowY: "auto",
          background: "var(--bg-primary)",
          border: "1px solid var(--DARK_GRAY)",
          borderRadius: "var(--border-radius-small)",
          boxSizing: "border-box",
          padding: 18,
          paddingBottom: 22,
          boxShadow: "var(--modal-shadow)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, color: "var(--text-primary)" }}>{track.title}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>전체 녹음 보기</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: 15, color: "var(--text-secondary)", cursor: "pointer" }}
          >
            닫기
          </button>
        </div>

        {sortedRecordings.length === 0 ? (
          <div
            style={{
              border: "1px solid var(--DARK_GRAY)",
              borderRadius: "var(--border-radius-medium)",
              padding: "20px 16px",
              boxSizing: "border-box",
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: 14
            }}
          >
            아직 저장된 녹음이 없습니다.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 2 }}>
            {sortedRecordings.map((recording) => {
              const isEditing = editingId === recording.id;
              return (
                <div
                  key={recording.id}
                  style={{
                    border: "1px solid var(--DARK_GRAY)",
                    borderRadius: "var(--border-radius-medium)",
                    padding: 12,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "var(--text-primary)", wordBreak: "break-all" }}>{recording.archiveName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                        {dayjs(recording.createdAt).format("YYYY.MM.DD HH:mm")} · {formatDuration(recording.durationMs)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("이 녹음 기록을 삭제할까요?")) {
                          removeTrackRecording(recording.id);
                        }
                      }}
                      style={{ border: "none", background: "transparent", color: "var(--VIVA_MAGENTA)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      삭제
                    </button>
                  </div>

                  <RecordingMediaPreview recordingId={recording.id} mimeType={recording.mimeType} />

                  {isEditing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <textarea
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        rows={3}
                        placeholder="메모를 입력하세요"
                        style={{
                          width: "100%",
                          resize: "none",
                          border: "1px solid var(--DARK_GRAY)",
                          borderRadius: "var(--border-radius-small)",
                          padding: 10,
                          boxSizing: "border-box",
                          fontFamily: "var(--FONT_FAMILY)",
                          fontSize: 13,
                          color: "var(--text-primary)",
                          background: "transparent"
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setDraftNote("");
                          }}
                          style={{ border: "none", background: "transparent", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateTrackRecordingNote(recording.id, draftNote);
                            setEditingId(null);
                          }}
                          style={{ border: "none", background: "transparent", color: "var(--VERY_PERI)", fontSize: 13, cursor: "pointer" }}
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontSize: 12, color: recording.note ? "var(--text-primary)" : "var(--text-secondary)", minWidth: 0 }}>
                        {recording.note || "메모 없음"}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(recording.id);
                          setDraftNote(recording.note || "");
                        }}
                        style={{ border: "none", background: "transparent", color: "var(--VERY_PERI)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        메모 수정
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackRecordingsModal;
