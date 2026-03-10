// src/components/MetronomeSoundEngine.ts

import { AudioContextManager } from './AudioContextManager';
import { SoundBank } from './SoundBank';
import { SoundSettings, PreviewOptions, AudioError, Result } from './soundTypes';

export interface PreviewHandle {
  stop(): void;
  isActive(): boolean;
  getProgress(): number;
}

export class MetronomeSoundEngine {
  private static instance: MetronomeSoundEngine;
  private audioContextManager: AudioContextManager;
  private soundBank: SoundBank;
  private currentSettings: SoundSettings;
  private masterGain: GainNode | null = null;
  private activePreviewHandle: PreviewHandle | null = null;
  private isInitialized: boolean = false;

  public static getInstance(): MetronomeSoundEngine {
    if (!MetronomeSoundEngine.instance) {
      MetronomeSoundEngine.instance = new MetronomeSoundEngine();
    }
    return MetronomeSoundEngine.instance;
  }

  constructor() {
    this.audioContextManager = AudioContextManager.getInstance();
    this.soundBank = new SoundBank();
    this.currentSettings = {
      presetId: 'wood_block',
      volume: 0.7,
      accentGain: 1.5,
      muteWeakBeats: false,
      attackTime: 5,
      releaseTime: 100,
      reverb: 0,
      lowpass: 20000,
      lookaheadMs: 25,
      windowMs: 100
    };
  }

  public unlockAudio(): void {
    // 1. 동기적으로 컨텍스트 가져오기 (없으면 즉시 생성)
    const context = this.audioContextManager.getOrCreateContext();

    // 2. 즉시 resume (iOS 보안 통과 핵심: await 없이 실행되어야 함)
    if (context.state === 'suspended') {
      context.resume();
    }

    // 3. MediaSession 설정 (무음 스위치 우회)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Piano Metronome',
        artist: 'Pianolog',
      });
      // 더미 핸들러 등록
      navigator.mediaSession.setActionHandler('play', () => {});
      navigator.mediaSession.setActionHandler('pause', () => {});
    }

    // 4. 아주 짧은 무음 사운드 재생 (오디오 하드웨어 강제 활성화)
    try {
      const buffer = context.createBuffer(1, 1, 22050);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
    } catch (e) {
      console.warn('Silent play failed', e);
    }
  }
  
  async initialize(): Promise<Result<void>> {
    if (this.isInitialized) {
      return { success: true, data: undefined };
    }

    try {
      const contextResult = await this.audioContextManager.ensureContext();
      if (!contextResult.success) {
        return { 
          success: false, 
          error: (contextResult as { success: false; error: any }).error 
        };
      }

      const context = contextResult.data;

      this.masterGain = context.createGain();
      this.masterGain.connect(context.destination);
      this.masterGain.gain.value = this.currentSettings.volume;

      const soundBankResult = await this.soundBank.initialize();
      if (!soundBankResult.success) {
        return { 
          success: false, 
          error: (soundBankResult as { success: false; error: any }).error 
        };
      }

      await this.soundBank.preloadBasicSounds();

      this.isInitialized = true;
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to initialize MetronomeSoundEngine:', error);
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }
  }

  applySettings(settings: SoundSettings): Result<void> {
    if (!this.isInitialized || !this.masterGain) {
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }

    try {
      const now = this.audioContextManager.getCurrentContext()?.currentTime || 0;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(settings.volume, now, 0.01);

      const previousPresetId = this.currentSettings.presetId;
      this.currentSettings = { ...settings };

      if (settings.presetId !== previousPresetId) {
        this.soundBank.loadSound(settings.presetId).catch(error => {
          console.warn(`Failed to preload sound ${settings.presetId}:`, error);
        });
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to apply sound settings:', error);
      return {
        success: false,
        error: AudioError.InvalidSettings
      };
    }
  }

  playBeat(type: 'strong' | 'weak' | 'accent', when?: number): Result<void> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }

    if (this.currentSettings.muteWeakBeats && type === 'weak') {
      return { success: true, data: undefined };
    }

    const context = this.audioContextManager.getCurrentContext();
    if (!context) {
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }

    try {
      const playTime = when || context.currentTime;
      return this.playSound(type, playTime);
    } catch (error) {
      console.error('Failed to play beat:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }

  async preview(options: PreviewOptions): Promise<Result<PreviewHandle>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }

    if (this.activePreviewHandle) {
      this.activePreviewHandle.stop();
    }

    const context = this.audioContextManager.getCurrentContext();
    if (!context) {
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }

    try {
      const handle = new PreviewHandleImpl(context, this, options);
      await handle.start();
      this.activePreviewHandle = handle;
      
      return { success: true, data: handle };
    } catch (error) {
      console.error('Failed to start preview:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }

  stopAll(): Result<void> {
    try {
      if (this.activePreviewHandle) {
        this.activePreviewHandle.stop();
        this.activePreviewHandle = null;
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to stop all sounds:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }

  isPlaying(): boolean {
    return this.activePreviewHandle?.isActive() || false;
  }

  async dispose(): Promise<Result<void>> {
    try {
      this.stopAll();
      
      if (this.masterGain) {
        this.masterGain.disconnect();
        this.masterGain = null;
      }
      
      this.soundBank.dispose();
      this.isInitialized = false;
      
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to dispose sound engine:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }

  private playSound(type: 'strong' | 'weak' | 'accent', when: number): Result<void> {
    const buffer = this.soundBank.getCachedSound(this.currentSettings.presetId);
    if (!buffer) {
      this.soundBank.loadSound(this.currentSettings.presetId);
      return this.playFallbackSound(type, when);
    }

    const context = this.audioContextManager.getCurrentContext()!;
    
    try {
      const source = context.createBufferSource();
      const gainNode = context.createGain();
      
      source.buffer = buffer;
      if (this.currentSettings.presetId === 'mechanical') {
        source.playbackRate.value = type === 'weak' ? 1.05 : 1.0;
      }
      source.connect(gainNode);
      gainNode.connect(this.masterGain!);
      
      let volume = 1.0;
      if (type === 'strong' || type === 'accent') {
        volume *= this.currentSettings.accentGain;
      }
      if (this.currentSettings.presetId === 'mechanical' && type === 'weak') {
        volume *= 0.6;
      }
      gainNode.gain.value = volume;

      const duration = buffer.duration;

      if (this.currentSettings.presetId === 'mechanical') {
        gainNode.gain.setValueAtTime(volume, when);
        source.start(when, 0, Math.min(duration, 0.085));
        source.stop(when + Math.min(duration, 0.085));
      } else {
        const attackTime = this.currentSettings.attackTime / 1000;
        const releaseTime = this.currentSettings.releaseTime / 1000;

        gainNode.gain.setValueAtTime(0, when);
        gainNode.gain.linearRampToValueAtTime(volume, when + attackTime);
        gainNode.gain.setValueAtTime(volume, when + duration - releaseTime);
        gainNode.gain.linearRampToValueAtTime(0, when + duration);

        source.start(when);
        source.stop(when + duration);
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to play sound:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }

  private playFallbackSound(type: 'strong' | 'weak' | 'accent', when: number): Result<void> {
    const context = this.audioContextManager.getCurrentContext()!;
    
    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain!);
      
      const frequency = type === 'strong' ? 800 : 600;
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      let volume = 0.1;
      if (type === 'strong' || type === 'accent') {
        volume *= this.currentSettings.accentGain;
      }
      
      const duration = 0.1;
      gainNode.gain.setValueAtTime(0, when);
      gainNode.gain.linearRampToValueAtTime(volume, when + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, when + duration);
      
      oscillator.start(when);
      oscillator.stop(when + duration);
      
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to play fallback sound:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }
}

class PreviewHandleImpl implements PreviewHandle {
  private context: AudioContext;
  private soundEngine: MetronomeSoundEngine;
  private options: PreviewOptions;
  private startTime: number = 0;
  private duration: number = 0;
  private isActive_: boolean = false;

  constructor(
    context: AudioContext,
    soundEngine: MetronomeSoundEngine,
    options: PreviewOptions
  ) {
    this.context = context;
    this.soundEngine = soundEngine;
    this.options = options;
  }

  async start(): Promise<void> {
    this.isActive_ = true;
    this.startTime = this.context.currentTime;
    
    const pattern = this.generatePreviewPattern();
    this.duration = pattern.totalDuration;
    
    for (const beat of pattern.beats) {
      this.soundEngine.playBeat(
        beat.type,
        this.startTime + beat.time
      );
    }
    
    setTimeout(() => {
      this.isActive_ = false;
    }, this.duration * 1000);
  }

  stop(): void {
    this.isActive_ = false;
  }

  isActive(): boolean {
    if (!this.isActive_) return false;
    
    const elapsed = this.context.currentTime - this.startTime;
    return elapsed < this.duration;
  }

  getProgress(): number {
    if (!this.isActive_) return 1;
    
    const elapsed = this.context.currentTime - this.startTime;
    return Math.min(elapsed / this.duration, 1);
  }

  private generatePreviewPattern(): {
    beats: Array<{ time: number; type: 'strong' | 'weak' | 'accent' }>;
    totalDuration: number;
  } {
    const beats: Array<{ time: number; type: 'strong' | 'weak' | 'accent' }> = [];
    let time = 0;
    const beatInterval = 0.5;

    switch (this.options.type) {
      case 'single':
        beats.push({ time: 0, type: this.options.accent || 'strong' });
        return { beats, totalDuration: 0.5 };

      case 'pattern':
        const bars = this.options.bars || 1;
        for (let bar = 0; bar < bars; bar++) {
          for (let beat = 0; beat < 4; beat++) {
            const type = beat === 0 ? 'strong' : 'weak';
            beats.push({ time, type });
            time += beatInterval;
          }
        }
        return { beats, totalDuration: time };

      case 'subdivision':
        const subdivisions = this.options.steps || 4;
        const subBeatInterval = beatInterval / subdivisions;
        for (let i = 0; i < subdivisions; i++) {
          const type = i === 0 ? 'accent' : 'weak';
          beats.push({ time, type });
          time += subBeatInterval;
        }
        return { beats, totalDuration: time };

      default:
        return { beats, totalDuration: 0 };
    }
  }
}
