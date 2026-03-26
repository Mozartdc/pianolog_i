// src/components/MetronomeEngine.ts

import { AudioContextManager } from './AudioContextManager';
import { MetronomeSoundEngine } from './MetronomeSoundEngine';
import { RHYTHM_PATTERNS } from '../utils/rhythmUtils';
import { TimeSignature } from './useMetronomeStore';

export interface MetronomeEngineConfig {
  bpm: number;
  timeSignature: TimeSignature;
  rhythmPatternId: string;
  isMuted: boolean;
  beatPattern: Array<0 | 1 | 2 | 'A'>;
}

export interface MetronomeEngineCallbacks {
  onBeatChange: (beat: number) => void;
  onBPMChange: (bpm: number) => void;
  onStop: () => void;
}

export class MetronomeEngine {
  private audioContextManager: AudioContextManager;
  private soundEngine: MetronomeSoundEngine;
  private isPlaying = false;
  private isInitialized = false;
  private initializePromise: Promise<void> | null = null;

  private currentBPM = 120;
  private timeSignature: TimeSignature = { numerator: 4, denominator: 4 };
  private rhythmPatternId = 'one_beat';
  private isMuted = false;
  private beatPattern: Array<0 | 1 | 2 | 'A'> = ['A', 2, 2, 2];

  private nextNoteTime = 0;
  private scheduledBeat = 0;
  private currentBeat = 0;
  private foregroundLookaheadTime = 25;
  private foregroundScheduleHorizonSec = 0.15;
  private firstBeatOffsetSec = 0.1;
  private scheduleInterval: number | null = null;
  private startTime = 0;
  private uiTimeouts: number[] = [];
  private lastResumeAttemptAt = 0;
  private lastUiBeatContextTime = 0;
  private transportStartPerfMs = 0;

  private callbacks: MetronomeEngineCallbacks | null = null;

  constructor() {
    this.audioContextManager = AudioContextManager.getInstance();
    this.soundEngine = MetronomeSoundEngine.getInstance();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializePromise) {
      await this.initializePromise;
      return;
    }

    this.initializePromise = (async () => {
      try {
        const contextResult = await this.audioContextManager.ensureContext();
        if (!contextResult.success) {
          throw new Error('Failed to initialize audio context');
        }

        const soundResult = await this.soundEngine.initialize();
        if (!soundResult.success) {
          throw new Error('Failed to initialize metronome sound engine');
        }

        this.isInitialized = true;
        console.log('🎵 MetronomeEngine 초기화 완료');
      } catch (error) {
        console.error('❌ MetronomeEngine 초기화 실패:', error);
        throw error;
      } finally {
        this.initializePromise = null;
      }
    })();

    await this.initializePromise;
  }

  setCallbacks(callbacks: MetronomeEngineCallbacks): void {
    this.callbacks = callbacks;
  }

  updateConfig(config: Partial<MetronomeEngineConfig>): void {
    if (!this.isInitialized) return;

    let needsReschedule = false;
    let needsTimeGridReschedule = false;

    if (config.bpm !== undefined && config.bpm !== this.currentBPM) {
      this.currentBPM = config.bpm;
      if (this.isPlaying) {
        this.resetTransportAnchorFromCurrentBeat();
      }
      console.log('🎯 BPM 변경:', this.currentBPM);
    }

    if (config.timeSignature !== undefined) {
      if (
        config.timeSignature.numerator !== this.timeSignature.numerator ||
        config.timeSignature.denominator !== this.timeSignature.denominator
      ) {
        this.timeSignature = { ...config.timeSignature };
        this.currentBeat = 0;
        if (this.isPlaying) {
          this.resetTransportAnchorFromCurrentBeat();
        }
        needsReschedule = true;
        needsTimeGridReschedule = true;
        console.log('🎼 박자표 변경:', `${this.timeSignature.numerator}/${this.timeSignature.denominator}`);
      }
    }

    if (config.rhythmPatternId !== undefined && config.rhythmPatternId !== this.rhythmPatternId) {
      this.rhythmPatternId = config.rhythmPatternId;
      console.log('🎵 리듬 패턴 변경:', this.rhythmPatternId);
    }

    if (config.beatPattern !== undefined) {
      this.beatPattern = [...config.beatPattern];
      console.log('🎚️ 비트 패턴 변경:', this.beatPattern);
    }

    if (config.isMuted !== undefined) {
      this.isMuted = config.isMuted;
      console.log('🔇 음소거 상태:', this.isMuted);
    }

    if (this.isPlaying && needsReschedule && needsTimeGridReschedule) {
      this.reschedule();
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isPlaying) return;

    const ensureStartPerf = performance.now();
    const contextResult = await this.audioContextManager.ensureContext();
    const ensureEndPerf = performance.now();
    if (!contextResult.success) {
      throw new Error('Audio context not available');
    }

    const context = contextResult.data;
    let resumeLatency = 0;
    if (context.state !== 'running') {
      const resumeStartPerf = performance.now();
      await context.resume();
      resumeLatency = performance.now() - resumeStartPerf;
    }

    this.isPlaying = true;
    this.scheduledBeat = 0;
    this.currentBeat = 0;
    this.transportStartPerfMs = performance.now();
    this.lastUiBeatContextTime = context.currentTime;
    this.nextNoteTime = context.currentTime + this.firstBeatOffsetSec;
    this.startTime = context.currentTime;

    this.restartScheduleLoop();
    this.scheduleNotes();

    const scheduleMargin = this.nextNoteTime - context.currentTime;

    console.log('▶️ 메트로놈 시작:', {
      bpm: this.currentBPM,
      timeSignature: `${this.timeSignature.numerator}/${this.timeSignature.denominator}`,
      pattern: this.rhythmPatternId
    });
    console.log('[METRO_START_METRICS]', {
      ensureLatencyMs: Math.round((ensureEndPerf - ensureStartPerf) * 10) / 10,
      resumeLatencyMs: Math.round(resumeLatency * 10) / 10,
      scheduleMarginMs: Math.round(scheduleMargin * 1000),
      firstBeatOffsetMs: Math.round(this.firstBeatOffsetSec * 1000),
      horizonMs: Math.round(this.foregroundScheduleHorizonSec * 1000),
      lookaheadMs: this.foregroundLookaheadTime
    });
  }

  stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.clearScheduleLoop();
    this.soundEngine.stopAll();
    this.scheduledBeat = 0;
    this.currentBeat = 0;
    this.transportStartPerfMs = 0;
    this.lastUiBeatContextTime = 0;
    this.clearUITimeouts();

    console.log('⏹️ 메트로놈 정지');
    this.callbacks?.onStop();
  }

  getCurrentBeat(): number {
    return this.currentBeat;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  async recoverFromInterruption(): Promise<void> {
    if (!this.isPlaying) return;

    const ensureStartPerf = performance.now();
    const contextResult = await this.audioContextManager.ensureContext();
    const ensureEndPerf = performance.now();
    if (!contextResult.success) return;

    const context = contextResult.data;
    let resumeLatency = 0;
    if (context.state !== 'running') {
      const resumeStartPerf = performance.now();
      await context.resume();
      resumeLatency = performance.now() - resumeStartPerf;
    }

    this.clearUITimeouts();
    this.nextNoteTime = context.currentTime + this.firstBeatOffsetSec;
    this.scheduledBeat = (this.currentBeat + 1) % this.timeSignature.numerator;
    this.restartScheduleLoop();
    this.scheduleNotes();

    const scheduleMargin = this.nextNoteTime - context.currentTime;
    console.log('[METRO_RECOVER_METRICS]', {
      ensureLatencyMs: Math.round((ensureEndPerf - ensureStartPerf) * 10) / 10,
      resumeLatencyMs: Math.round(resumeLatency * 10) / 10,
      scheduleMarginMs: Math.round(scheduleMargin * 1000),
      scheduledBeat: this.scheduledBeat,
      currentBeat: this.currentBeat
    });
  }

  private scheduleNotes(): void {
    if (!this.isPlaying) return;

    const context = this.audioContextManager.getCurrentContext();
    if (!context) return;

    if (context.state !== 'running') {
      this.requestContextResume();
      return;
    }

    this.catchUpIfBehind(context.currentTime);

    while (this.nextNoteTime < context.currentTime + this.foregroundScheduleHorizonSec) {
      this.playNote(this.nextNoteTime, this.scheduledBeat);
      this.advanceNote();
    }
  }

  private playNote(when: number, beatIndex: number): void {
    if (this.isMuted) return;

    const pattern = RHYTHM_PATTERNS.find((p) => p.id === this.rhythmPatternId);
    if (!pattern) {
      this.playSimpleBeat(when, beatIndex);
      this.scheduleUIBeat(beatIndex, when);
      return;
    }

    this.playSubdivisionPattern(pattern, when, beatIndex);
    this.scheduleUIBeat(beatIndex, when);
  }

  private playSimpleBeat(when: number, beatIndex: number): void {
    const beatType = this.getBeatTypeForIndex(beatIndex);
    if (beatType === null) return;
    this.soundEngine.playBeat(beatType, when);
  }

  private playSubdivisionPattern(pattern: any, when: number, beatIndex: number): void {
    const beatTypeForBeat = this.getBeatTypeForIndex(beatIndex);
    if (beatTypeForBeat === null) return;

    const tickPattern = pattern.getTickPattern();
    const subdivisionDuration = this.getBeatDuration() / tickPattern.length;

    tickPattern.forEach((tick: number, index: number) => {
      if (tick !== 1) return;

      const tickTime = when + index * subdivisionDuration;
      const beatType: 'strong' | 'weak' | 'accent' = index === 0 ? beatTypeForBeat : 'weak';
      this.soundEngine.playBeat(beatType, tickTime);
    });
  }

  private advanceNote(): void {
    const beatDuration = this.getBeatDuration();
    this.nextNoteTime += beatDuration;
    this.scheduledBeat = (this.scheduledBeat + 1) % this.timeSignature.numerator;
  }

  private getBeatDuration(): number {
    const quarterNoteDuration = 60.0 / this.currentBPM;
    return quarterNoteDuration * (4 / this.timeSignature.denominator);
  }

  private reschedule(): void {
    if (!this.isPlaying) return;

    const context = this.audioContextManager.getCurrentContext();
    if (!context) return;

    this.nextNoteTime = context.currentTime;
    this.scheduledBeat = this.currentBeat;
    this.clearUITimeouts();
    console.log('🔄 메트로놈 재스케줄링');
  }

  private scheduleUIBeat(beatIndex: number, when: number): void {
    const context = this.audioContextManager.getCurrentContext();
    if (!context) return;

    const delayMs = Math.max(0, (when - context.currentTime) * 1000);
    const timeoutId = window.setTimeout(() => {
      if (!this.isPlaying) return;
      this.currentBeat = beatIndex;
      this.lastUiBeatContextTime = when;
      this.callbacks?.onBeatChange(beatIndex);
    }, delayMs);

    this.uiTimeouts.push(timeoutId);
  }

  private clearUITimeouts(): void {
    this.uiTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.uiTimeouts = [];
  }

  private restartScheduleLoop(): void {
    this.clearScheduleLoop();
    this.scheduleInterval = window.setInterval(() => {
      this.scheduleNotes();
    }, this.foregroundLookaheadTime);
  }

  private clearScheduleLoop(): void {
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
      this.scheduleInterval = null;
    }
  }

  private catchUpIfBehind(currentTime: number): void {
    if (this.nextNoteTime >= currentTime) return;

    const beatDuration = this.getBeatDuration();
    if (beatDuration <= 0) return;

    const beatsBehind = Math.floor((currentTime - this.nextNoteTime) / beatDuration);
    if (beatsBehind <= 0) return;

    this.nextNoteTime += beatsBehind * beatDuration;
    this.scheduledBeat = (this.scheduledBeat + beatsBehind) % this.timeSignature.numerator;
  }

  private requestContextResume(): void {
    const now = Date.now();
    if (now - this.lastResumeAttemptAt < 800) return;
    this.lastResumeAttemptAt = now;

    this.audioContextManager.ensureContext().catch((error) => {
      console.warn('AudioContext resume attempt failed:', error);
    });
  }

  private getBeatTypeForIndex(beatIndex: number): 'strong' | 'weak' | 'accent' | null {
    const value = this.beatPattern[beatIndex] ?? (beatIndex === 0 ? 2 : 1);
    if (value === 0) return null;
    if (value === 2) return 'strong';
    if (value === 'A') return 'accent';
    return 'weak';
  }

  async dispose(): Promise<void> {
    this.stop();
    await this.soundEngine.dispose();
    this.isInitialized = false;
    console.log('🗑️ MetronomeEngine 정리 완료');
  }

  private resetTransportAnchorFromCurrentBeat(): void {
    const beatDuration = this.getBeatDuration();
    this.transportStartPerfMs = performance.now() - this.currentBeat * beatDuration * 1000;
  }
}

export class TapTempo {
  private tapTimes: number[] = [];
  private maxTaps = 8;
  private maxInterval = 3000;

  tap(): number | null {
    const now = Date.now();
    this.tapTimes = this.tapTimes.filter((time) => now - time < this.maxInterval);
    this.tapTimes.push(now);

    if (this.tapTimes.length < 2) {
      return null;
    }

    if (this.tapTimes.length > this.maxTaps) {
      this.tapTimes = this.tapTimes.slice(-this.maxTaps);
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.tapTimes.length; i += 1) {
      intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const bpm = Math.round(60000 / averageInterval);

    if (bpm < 20 || bpm > 400) {
      return null;
    }

    console.log('🥁 탭 템포 계산:', {
      taps: this.tapTimes.length,
      averageInterval: Math.round(averageInterval),
      bpm
    });

    return bpm;
  }

  reset(): void {
    this.tapTimes = [];
  }

  getTapCount(): number {
    return this.tapTimes.length;
  }
}
