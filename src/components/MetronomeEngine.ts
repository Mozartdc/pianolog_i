// src/components/MetronomeEngine.ts

import { AudioContextManager } from './AudioContextManager';
import { MetronomeSoundEngine } from './MetronomeSoundEngine';
import { RHYTHM_PATTERNS } from '../utils/rhythmUtils';
import { TimeSignature } from './useMetronomeStore';
import { RhythmTrainingMode } from './useRhythmTraining';

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
  private isPlaying: boolean = false;
  private isInitialized: boolean = false;
  
  // Timing properties
  private currentBPM: number = 120;
  private timeSignature: TimeSignature = { numerator: 4, denominator: 4 };
  private rhythmPatternId: string = 'one_beat';
  private isMuted: boolean = false;
  private beatPattern: Array<0 | 1 | 2 | 'A'> = ['A', 2, 2, 2];
  
  // Scheduling properties
  private nextNoteTime: number = 0;
  private scheduledBeat: number = 0; // Beat being scheduled for playback
  private currentBeat: number = 0;   // Beat being displayed in UI
  private lookaheadTime: number = 25; // milliseconds
  private scheduleInterval: number | null = null;
  private startTime: number = 0;
  private uiTimeouts: number[] = [];
  
  // Callbacks
  private callbacks: MetronomeEngineCallbacks | null = null;
  
  constructor() {
    this.audioContextManager = AudioContextManager.getInstance();
    this.soundEngine = MetronomeSoundEngine.getInstance();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize audio context
      const contextResult = await this.audioContextManager.ensureContext();
      if (!contextResult.success) {
        throw new Error('Failed to initialize audio context');
      }

      // Initialize sound engine
      await this.soundEngine.initialize();
      
      this.isInitialized = true;
      console.log('🎵 MetronomeEngine 초기화 완료');
    } catch (error) {
      console.error('❌ MetronomeEngine 초기화 실패:', error);
      throw error;
    }
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
      // BPM changes are applied continuously by getBeatDuration().
      // Avoid forced reschedule here to prevent audible hiccups.
      console.log('🎯 BPM 변경:', this.currentBPM);
    }

    if (config.timeSignature !== undefined) {
      if (config.timeSignature.numerator !== this.timeSignature.numerator ||
          config.timeSignature.denominator !== this.timeSignature.denominator) {
        this.timeSignature = { ...config.timeSignature };
        this.currentBeat = 0; // Reset beat when time signature changes
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

    // If playing and critical parameters changed, reschedule
    if (this.isPlaying && needsReschedule && needsTimeGridReschedule) {
      this.reschedule();
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isPlaying) return;

    const context = this.audioContextManager.getCurrentContext();
    if (!context) {
      throw new Error('Audio context not available');
    }

    // iOS에서 재생 시 AudioContext 다시 한번 resume
    if (context.state === 'suspended') {
      console.log('재생 시 AudioContext suspended, resuming...');
    }

    this.isPlaying = true;
    this.scheduledBeat = 0;
    this.currentBeat = 0;
    this.nextNoteTime = context.currentTime;
    this.startTime = context.currentTime;
    this.callbacks?.onBeatChange(0);

    console.log('메트로놈 시작 상태:', {
      contextState: context.state,
      currentTime: context.currentTime,
      startTime: this.startTime
    });

    // Start the scheduling loop
    this.scheduleInterval = window.setInterval(() => {
      this.scheduleNotes();
    }, this.lookaheadTime);

    console.log('▶️ 메트로놈 시작:', {
      bpm: this.currentBPM,
      timeSignature: `${this.timeSignature.numerator}/${this.timeSignature.denominator}`,
      pattern: this.rhythmPatternId
    });
  }

  stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
      this.scheduleInterval = null;
    }

    this.soundEngine.stopAll();
    this.scheduledBeat = 0;
    this.currentBeat = 0;
    this.clearUITimeouts();

    console.log('⏹️ 메트로놈 정지');
    
    // Notify callback
    this.callbacks?.onStop();
  }

  getCurrentBeat(): number {
    return this.currentBeat;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  private scheduleNotes(): void {
    if (!this.isPlaying) return;

    const context = this.audioContextManager.getCurrentContext();
    if (!context) return;

    // Schedule notes that need to be played in the lookahead window
    const lookaheadSeconds = this.lookaheadTime / 1000;
    
    while (this.nextNoteTime < context.currentTime + lookaheadSeconds) {
      this.playNote(this.nextNoteTime, this.scheduledBeat);
      this.advanceNote();
    }

  }

  private playNote(when: number, beatIndex: number): void {
    if (this.isMuted) return;

    const pattern = RHYTHM_PATTERNS.find(p => p.id === this.rhythmPatternId);
    if (!pattern) {
      // Fallback to simple metronome
      this.playSimpleBeat(when, beatIndex);
      this.scheduleUIBeat(beatIndex, when);
      return;
    }

    // Play subdivision pattern
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
      if (tick === 1) { // Sound this subdivision
        const tickTime = when + (index * subdivisionDuration);
        let beatType: 'strong' | 'weak' | 'accent';
        
        if (index === 0) {
          beatType = beatTypeForBeat;
        } else {
          beatType = 'weak'; // Other subdivisions
        }
        
        this.soundEngine.playBeat(beatType, tickTime);
      }
    });
  }

  private advanceNote(): void {
    const beatDuration = this.getBeatDuration();
    this.nextNoteTime += beatDuration;
    
    // Advance the beat counter for scheduling purposes
    this.scheduledBeat = (this.scheduledBeat + 1) % this.timeSignature.numerator;
    console.log(`스케줄 박자 진행: ${this.scheduledBeat + 1}/${this.timeSignature.numerator}`);
  }

  private getBeatDuration(): number {
    // Duration of one beat based on BPM and time signature denominator
    const quarterNoteDuration = 60.0 / this.currentBPM;
    return quarterNoteDuration * (4 / this.timeSignature.denominator);
  }

  private reschedule(): void {
    if (!this.isPlaying) return;

    const context = this.audioContextManager.getCurrentContext();
    if (!context) return;

    // Smoothly transition to new timing
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
      this.callbacks?.onBeatChange(beatIndex);
    }, delayMs);

    this.uiTimeouts.push(timeoutId);
  }

  private clearUITimeouts(): void {
    this.uiTimeouts.forEach(timeoutId => window.clearTimeout(timeoutId));
    this.uiTimeouts = [];
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
}

// Tap Tempo implementation
export class TapTempo {
  private tapTimes: number[] = [];
  private maxTaps: number = 8;
  private maxInterval: number = 3000; // 3 seconds max between taps

  tap(): number | null {
    const now = Date.now();
    
    // Remove old taps
    this.tapTimes = this.tapTimes.filter(time => now - time < this.maxInterval);
    
    // Add current tap
    this.tapTimes.push(now);
    
    // Need at least 2 taps to calculate BPM
    if (this.tapTimes.length < 2) {
      return null;
    }

    // Keep only recent taps
    if (this.tapTimes.length > this.maxTaps) {
      this.tapTimes = this.tapTimes.slice(-this.maxTaps);
    }

    // Calculate average interval
    const intervals: number[] = [];
    for (let i = 1; i < this.tapTimes.length; i++) {
      intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const bpm = Math.round(60000 / averageInterval);

    // Validate BPM range
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
