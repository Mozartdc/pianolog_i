import dayjs from "dayjs";
import type { PartialCounts, PracticeChecks, Track } from "../../contexts/PracticeDataContext";

export type TodayTrackViewModel = {
  id: number;
  title: string;
  subtitle: string;
  checked: boolean;
  count: number;
};

type BuildTodayTrackViewModelsInput = {
  tracks: Track[];
  selectedDate: string;
  practiceChecks: PracticeChecks;
  partialCounts: PartialCounts;
  nowDate?: string;
};

export function isTrackVisibleOnDate(
  track: Track,
  selectedDate: string,
  selectedDateChecks: PracticeChecks[string] | undefined
): boolean {
  const addedBeforeOrOn = dayjs(track.addedDate).isSameOrBefore(selectedDate, "day");
  const notCompletedOrCompletedAfter =
    !track.completedDate || dayjs(track.completedDate).isSameOrAfter(selectedDate, "day");
  const hasPracticeOnDate = !!selectedDateChecks?.[track.id];

  return (addedBeforeOrOn && notCompletedOrCompletedAfter) || hasPracticeOnDate;
}

export function buildTodayTrackViewModels({
  tracks,
  selectedDate,
  practiceChecks,
  partialCounts,
  nowDate,
}: BuildTodayTrackViewModelsInput): TodayTrackViewModel[] {
  const currentDate = nowDate ?? dayjs().format("YYYY-MM-DD");
  const selectedDateChecks = practiceChecks[selectedDate];
  const selectedDateCounts = partialCounts[selectedDate];

  return tracks
    .filter((track) => isTrackVisibleOnDate(track, selectedDate, selectedDateChecks))
    .map((track) => {
      const daysSince = dayjs(currentDate).diff(dayjs(track.addedDate), "day") + 1;
      return {
        id: track.id,
        title: track.title,
        subtitle: `오늘로 ${daysSince}일째`,
        checked: !!selectedDateChecks?.[track.id],
        count: selectedDateCounts?.[track.id] || 0,
      };
    });
}
