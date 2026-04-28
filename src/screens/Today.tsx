"use client";
import { TodayView } from "./today/TodayView";
import { useTodayState } from "./today/useTodayState";

export function Today() {
  const state = useTodayState();
  return <TodayView state={state} />;
}

export default Today;
