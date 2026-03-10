import { useCallback, useSyncExternalStore } from 'react';

export interface TimeSignature {
  numerator: number;    // 1-16
  denominator: number;  // 1, 2, 4, 8
}

export interface MetronomeState {
  bpm: number;
  isPlaying: boolean;
  currentBeat: number;
  timeSignature: TimeSignature;
  rhythmMode: 'wave' | 'timer';
}

const initialState: MetronomeState = {
  bpm: 120,
  isPlaying: false,
  currentBeat: 0,
  timeSignature: { numerator: 4, denominator: 4 },
  rhythmMode: 'wave'
};

let storeState: MetronomeState = initialState;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => storeState;

const updateState = (updater: (prev: MetronomeState) => MetronomeState) => {
  const nextState = updater(storeState);
  if (Object.is(nextState, storeState)) return;
  storeState = nextState;
  listeners.forEach(listener => listener());
};

export const useMetronomeStore = () => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Basic setters
  const setBpm = useCallback((bpm: number) => {
    updateState(prev => ({ ...prev, bpm }));
  }, []);

  const setIsPlaying = useCallback((isPlaying: boolean) => {
    updateState(prev => ({ ...prev, isPlaying }));
  }, []);

  const setCurrentBeat = useCallback((currentBeat: number) => {
    updateState(prev => ({ ...prev, currentBeat }));
  }, []);

  const setTimeSignature = useCallback((timeSignature: TimeSignature) => {
    updateState(prev => ({
      ...prev, 
      timeSignature,
      currentBeat: 0 // Reset beat when time signature changes
    }));
  }, []);

  const setRhythmMode = useCallback((rhythmMode: 'wave' | 'timer') => {
    updateState(prev => ({ ...prev, rhythmMode }));
  }, []);

  const togglePlaying = useCallback(() => {
    updateState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // Utility functions
  const getTimeSignatureString = useCallback(() => {
    return `${state.timeSignature.numerator}/${state.timeSignature.denominator}`;
  }, [state.timeSignature]);

  // Generate beat pattern (strong/weak beats)
  const getBeatPattern = useCallback(() => {
    const { numerator } = state.timeSignature;
    const pattern: number[] = [];
    
    for (let i = 0; i < numerator; i++) {
      pattern.push(i === 0 ? 2 : 1); // First beat is strong (2), others are weak (1)
    }
    
    return pattern;
  }, [state.timeSignature]);

  // Calculate base beat duration in milliseconds - based on time signature denominator
  const getBaseBeatDuration = useCallback(() => {
    const { denominator } = state.timeSignature;
    const quarterNoteDuration = (60 / state.bpm) * 1000; // Quarter note duration in ms
    return quarterNoteDuration * (4 / denominator); // Base beat duration based on denominator
  }, [state.bpm, state.timeSignature.denominator]);

  return {
    ...state,
    setBpm,
    setIsPlaying,
    setCurrentBeat,
    setTimeSignature,
    setRhythmMode,
    togglePlaying,
    getTimeSignatureString,
    getBeatPattern,
    getBaseBeatDuration
  };
};
