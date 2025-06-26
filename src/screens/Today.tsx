"use client";
import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ko";
import Header from "../components/Header";
import DatePicker from "../components/DatePicker";

type Track = {
  id: number;
  title: string;
  addedDate: string;
  completedDate?: string;
};

type PracticeChecks = {
  [date: string]: { [trackId: number]: boolean };
};

type PartialCounts = {
  [trackId: number]: number;
};

function getToday(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getWeekStart(date: Dayjs): Dayjs {
  const dayOfWeek = date.day() === 0 ? 6 : date.day() - 1;
  return date.subtract(dayOfWeek, "day").startOf("day");
}

function loadPracticeData(): any[] {
  const data = localStorage.getItem("practiceRecords");
  return data ? JSON.parse(data) : [];
}

function savePracticeData( any): void {
  localStorage.setItem("practiceRecords", JSON.stringify('data'));
}

export function Today() {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem("tracks");
    return saved ? JSON.parse(saved) : [];
  });

  const [practiceChecks, setPracticeChecks] = useState<PracticeChecks>(() => {
    const saved = localStorage.getItem("practiceChecks");
    return saved ? JSON.parse(saved) : {};
  });

  const [partialCounts, setPartialCounts] = useState<PartialCounts>(() => {
    const saved = localStorage.getItem("partialCounts");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentWeekStart, setCurrentWeekStart] = useState<Dayjs>(getWeekStart(dayjs()));
  const [showSongPlusModal, setShowSongPlusModal] = useState(false);

  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    currentWeekStart.add(i, "day")
  );

  useEffect(() => {
    localStorage.setItem("tracks", JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem("practiceChecks", JSON.stringify(practiceChecks));
  }, [practiceChecks]);

  useEffect(() => {
    localStorage.setItem("partialCounts", JSON.stringify(partialCounts));
  }, [partialCounts]);

  const addTrack = (title: string): void => {
    if (!title.trim()) return;
    const today = getToday();
    const newTrack: Track = { id: Date.now(), title: title.trim(), addedDate: today };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (id: number): void => {
    const track = tracks.find(t => t.id === id);
    setTracks(tracks.filter((t) => t.id !== id));
    
    setPartialCounts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    
    setPracticeChecks((prev) => {
      const copy: PracticeChecks = {};
      for (const date in prev) {
        copy[date] = { ...prev[date] };
        delete copy[date][id];
      }
      return copy;
    });

    if (track) {
      const prevRecords = loadPracticeData();
      const updated = prevRecords.filter((r: any) => r.track !== track.title);
      savePracticeData(updated);
    }
  };

  const toggleCheck = (trackId: number): void => {
    const dateStr = selectedDate.format("YYYY-MM-DD");
    setPracticeChecks((prev) => {
      const dayChecks = prev[dateStr] ? { ...prev[dateStr] } : {};
      const checked = !dayChecks[trackId];
      dayChecks[trackId] = checked;
      const updated = { ...prev, [dateStr]: dayChecks };

      let practiceRecords = loadPracticeData();
      const track = tracks.find(t => t.id === trackId);
      if (checked && track) {
        practiceRecords = [
          ...practiceRecords,
          { date: dateStr, track: track.title, repeatCount: 1 }
        ];
      } else if (!checked && track) {
        practiceRecords = practiceRecords.filter(
          (r: any) => !(r.date === dateStr && r.track === track.title)
        );
      }
      savePracticeData(practiceRecords);

      return updated;
    });
  };

  const incPartial = (trackId: number): void => {
    setPartialCounts((prev) => ({
      ...prev,
      [trackId]: (prev[trackId] || 0) + 1,
    }));
  };

  const decPartial = (trackId: number): void => {
    setPartialCounts((prev) => ({
      ...prev,
      [trackId]: Math.max((prev[trackId] || 0) - 1, 0),
    }));
  };

  const moveToPrevWeek = (): void => {
    setCurrentWeekStart(currentWeekStart.subtract(1, "week"));
  };

  const moveToNextWeek = (): void => {
    setCurrentWeekStart(currentWeekStart.add(1, "week"));
  };

  const selectedDateStr = selectedDate.format("YYYY-MM-DD");
  const visibleTracks = tracks.filter(
    (track) =>
      track.addedDate <= selectedDateStr &&
      (!track.completedDate || selectedDateStr <= track.completedDate)
  );

  const isFuture = selectedDate.isAfter(dayjs(), "day");

  return (
    <main className="flex overflow-hidden flex-col items-center pt-11 mx-auto w-full bg-white max-w-[480px]">
      <Header 
        title="Today"
        showBackButton={false}
      />

      <DatePicker 
        weekDays={weekDays}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onPrevWeek={moveToPrevWeek}
        onNextWeek={moveToNextWeek}
      />

      <section className="w-full max-w-[343px] mt-9" aria-label="Practice items">
        {visibleTracks.map((track) => {
          const isChecked = !!(practiceChecks[selectedDateStr] && practiceChecks[selectedDateStr][track.id]);
          const partialCount = partialCounts[track.id] || 0;
          const daysSince = dayjs().diff(dayjs(track.addedDate), 'day') + 1;

          return (
            <article key={track.id} className="flex gap-3 items-center py-2 pr-4 pl-3 mt-4 w-full rounded-xl border-solid border-[0.5px] border-[color:var(--Very-Peri,#6667AB)] max-w-[343px] min-h-16">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleCheck(track.id)}
                disabled={isFuture}
                className="w-4 h-4"
              />
              <img
                src="https://cdn.builder.io/api/v1/image/assets/744167cc4dee418e98e1340f850526a7/ebf6ed31025f0b6e3474d9dfa3beb31e46224e85?placeholderIfAbsent=true"
                alt="Piano piece"
                className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
              />
              <div className="flex flex-col justify-center self-stretch my-auto w-[179px]">
                <h3 className="text-base text-ellipsis text-zinc-800">{track.title}</h3>
                <p className="gap-1.5 self-start text-sm leading-loose text-ellipsis text-stone-400">
                  오늘로 {daysSince}일째
                </p>
              </div>
              <img
                src="https://cdn.builder.io/api/v1/image/assets/744167cc4dee418e98e1340f850526a7/9af3dad32d38097f711ef3a0f7730e5ce0b329b5?placeholderIfAbsent=true"
                alt="Practice streak"
                className="object-contain shrink-0 self-stretch my-auto w-4 aspect-square"
              />
              <button onClick={() => decPartial(track.id)} className="px-1 py-1 text-sm bg-gray-200 rounded">-</button>
              <span className="self-stretch my-auto text-sm leading-loose text-slate-500 mx-1">
                {partialCount}
              </span>
              <button onClick={() => incPartial(track.id)} className="px-1 py-1 text-sm bg-gray-200 rounded">+</button>
              <img
                src="https://cdn.builder.io/api/v1/image/assets/744167cc4dee418e98e1340f850526a7/be3a1b3cfe9bc167c3ce1337bf002dae535a4bd8?placeholderIfAbsent=true"
                alt="More options"
                className="object-contain shrink-0 self-stretch my-auto w-4 aspect-square cursor-pointer"
                onClick={() => removeTrack(track.id)}
              />
            </article>
          );
        })}
      </section>

      <button
        onClick={() => setShowSongPlusModal(true)}
        className="object-contain mt-16 aspect-square w-[50px] rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
        aria-label="Add new practice song"
      >
        <span className="text-white text-2xl font-bold">+</span>
      </button>

      {showSongPlusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold mb-4">연습 곡 추가</h2>
            <input
              type="text"
              placeholder="곡명을 입력하세요"
              className="w-full p-2 border rounded mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addTrack((e.target as HTMLInputElement).value);
                  setShowSongPlusModal(false);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSongPlusModal(false)}
                className="flex-1 p-2 border rounded"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  const input = document.querySelector('input[placeholder="곡명을 입력하세요"]') as HTMLInputElement;
                  if (input) {
                    addTrack(input.value);
                    setShowSongPlusModal(false);
                    input.value = '';
                  }
                }}
                className="flex-1 p-2 bg-blue-500 text-white rounded"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Today;
