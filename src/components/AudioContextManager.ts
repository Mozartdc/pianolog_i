// src/components/AudioContextManager.ts

import { AudioError, Result } from './soundTypes';

export class AudioContextManager {
  private static instance: AudioContextManager;
  private context: AudioContext | null = null;
  private resumePromise: Promise<void> | null = null;

  private constructor() {
    this.setupEventListeners();
  }

  // Get the single instance (singleton pattern)
  public static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  // Make sure we have a working audio context
  async ensureContext(): Promise<Result<AudioContext>> {
    try {
      // Create new context if we don't have one or it's closed
      if (!this.context || this.context.state === 'closed') {
        this.context = new AudioContext({
          sampleRate: 44100,
          latencyHint: 'interactive'
        });
      }

      // Wake up the context when it's not running (Safari may report "interrupted")
      if (this.context.state !== 'running') {
        if (!this.resumePromise) {
          this.resumePromise = this.context.resume().then(() => {
            this.resumePromise = null;
          }).catch((error) => {
            this.resumePromise = null;
            throw error;
          });
        }
        await this.resumePromise;
      }

      return { success: true, data: this.context };
    } catch (error) {
      console.error('Failed to create or resume AudioContext:', error);
      return { 
        success: false, 
        error: AudioError.ContextCreationFailed 
      };
    }
  }

  // Get the current audio context (might be null)
  getCurrentContext(): AudioContext | null {
    return this.context;
  }

// iOS 대응: 즉시 컨텍스트를 가져오거나 생성하는 동기 메서드
  public getOrCreateContext(): AudioContext {
    if (!this.context || this.context.state === 'closed') {
      // @ts-ignore - webkitAudioContext 대응
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContextClass({
        sampleRate: 44100,
        latencyHint: 'interactive'
      });
    }
    return this.context;
  }

  // Check what state the audio context is in
  getState(): AudioContextState | null {
    return this.context?.state || null;
  }

  // Put the audio context to sleep
  async suspend(): Promise<Result<void>> {
    if (!this.context || this.context.state === 'closed') {
      return { success: true, data: undefined };
    }

    try {
      await this.context.suspend();
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to suspend AudioContext:', error);
      return { 
        success: false, 
        error: AudioError.ContextCreationFailed 
      };
    }
  }

  // Shut down the audio context completely
  async close(): Promise<Result<void>> {
    if (!this.context) {
      return { success: true, data: undefined };
    }

    try {
      await this.context.close();
      this.context = null;
      this.resumePromise = null;
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to close AudioContext:', error);
      return { 
        success: false, 
        error: AudioError.ContextCreationFailed 
      };
    }
  }

  // Set up listeners for page events
  private setupEventListeners(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.context && this.context.state !== 'running') {
        this.context.resume().catch((error) => {
          console.warn('Failed to resume AudioContext on visibilitychange:', error);
        });
      }
    });

    window.addEventListener('pageshow', () => {
      if (this.context && this.context.state !== 'running') {
        this.context.resume().catch((error) => {
          console.warn('Failed to resume AudioContext on pageshow:', error);
        });
      }
    });

    // Clean up when page is closing
    window.addEventListener('beforeunload', () => {
      this.close();
    });
  }
}
