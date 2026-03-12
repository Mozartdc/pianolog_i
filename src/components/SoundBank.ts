// src/components/SoundBank.ts

import { AudioContextManager } from './AudioContextManager';
import { SoundGenerator } from './SoundGenerator';
import { AudioError, Result, SoundPreset, SOUND_PRESETS } from './soundTypes';

export class SoundBank {
  private audioContextManager: AudioContextManager;
  private soundGenerator: SoundGenerator | null = null;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<Result<AudioBuffer>>> = new Map();

  constructor() {
    this.audioContextManager = AudioContextManager.getInstance();
  }

  async initialize(): Promise<Result<void>> {
    const contextResult = await this.audioContextManager.ensureContext();
    if (!contextResult.success) {
      return { 
        success: false, 
        error: (contextResult as { success: false; error: any }).error 
      };
    }

    this.soundGenerator = new SoundGenerator(contextResult.data);
    return { success: true, data: undefined };
  }

  async loadSound(presetId: string): Promise<Result<AudioBuffer>> {
    const cached = this.audioBufferCache.get(presetId);
    if (cached) {
      return { success: true, data: cached };
    }

    const loadingPromise = this.loadingPromises.get(presetId);
    if (loadingPromise) {
      return loadingPromise;
    }

    const preset = SOUND_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      return {
        success: false,
        error: AudioError.InvalidSettings
      };
    }

    const promise = this.loadSoundInternal(preset);
    this.loadingPromises.set(presetId, promise);

    const result = await promise;
    this.loadingPromises.delete(presetId);

    if (result.success) {
      this.audioBufferCache.set(presetId, result.data);
    }

    return result;
  }

  async preloadBasicSounds(): Promise<Result<void>> {
    const basicPresets = [
      'wood_block',
      'shaker',
      'beep',
      'mechanical',
      'mechanical_accent',
      'mechanical_weak',
      'marimba'
    ];
    const loadPromises = basicPresets.map(presetId => this.loadSound(presetId));
    
    try {
      const results = await Promise.allSettled(loadPromises);
      
      const failures = results
        .filter((result, index) => result.status === 'rejected' || 
                (result.status === 'fulfilled' && !result.value.success))
        .map((_, index) => basicPresets[index]);

      if (failures.length > 0) {
        console.warn('Failed to preload some sounds:', failures);
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to preload basic sounds:', error);
      return {
        success: false,
        error: AudioError.FileLoadFailed
      };
    }
  }

  async preloadPresetFamily(presetId: string): Promise<Result<void>> {
    const presetIds =
      presetId === 'mechanical'
        ? ['mechanical', 'mechanical_accent', 'mechanical_weak']
        : [presetId];

    const loadPromises = presetIds.map((id) => this.loadSound(id));

    try {
      const results = await Promise.allSettled(loadPromises);
      const failures = results
        .filter(
          (result) =>
            result.status === 'rejected' ||
            (result.status === 'fulfilled' && !result.value.success)
        )
        .map((_, index) => presetIds[index]);

      if (failures.length > 0) {
        console.warn('Failed to preload preset family:', failures);
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to preload preset family:', error);
      return {
        success: false,
        error: AudioError.FileLoadFailed
      };
    }
  }

  getCachedSound(presetId: string): AudioBuffer | null {
    return this.audioBufferCache.get(presetId) || null;
  }

  clearCache(): void {
    this.audioBufferCache.clear();
    this.loadingPromises.clear();
  }

  getCacheInfo(): {
    cachedSounds: string[];
    loadingSounds: string[];
    cacheSize: number;
  } {
    return {
      cachedSounds: Array.from(this.audioBufferCache.keys()),
      loadingSounds: Array.from(this.loadingPromises.keys()),
      cacheSize: this.audioBufferCache.size
    };
  }

  private async loadSoundInternal(preset: SoundPreset): Promise<Result<AudioBuffer>> {
    if (!this.soundGenerator) {
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }

    try {
      if (preset.audioFile) {
        return await this.loadAudioFile(preset.audioFile);
      } else {
        return this.generateDynamicSound(preset);
      }
    } catch (error) {
      console.error(`Failed to load sound ${preset.id}:`, error);
      return {
        success: false,
        error: AudioError.FileLoadFailed
      };
    }
  }

  private generateDynamicSound(preset: SoundPreset): Result<AudioBuffer> {
    if (!this.soundGenerator) {
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }

    const soundParams = this.getSoundParams(preset.id);
    
    return this.soundGenerator.generateSoundByType(
      soundParams.type,
      soundParams.options
    );
  }

  private async loadAudioFile(filePath: string): Promise<Result<AudioBuffer>> {
    const contextResult = await this.audioContextManager.ensureContext();
    if (!contextResult.success) {
      return { 
        success: false, 
        error: (contextResult as { success: false; error: any }).error 
      };
    }

    const context = contextResult.data;

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);

      return { success: true, data: audioBuffer };
    } catch (error) {
      console.error(`Failed to load audio file ${filePath}:`, error);
      return {
        success: false,
        error: AudioError.FileLoadFailed
      };
    }
  }

  private getSoundParams(presetId: string): {
    type:
      | 'beep'
      | 'click'
      | 'wood'
      | 'metallic'
      | 'shaker'
      | 'tambourine'
      | 'mechanical'
      | 'pendulum'
      | 'marimba'
      | 'xylophone';
    options: {
      frequency?: number;
      duration?: number;
      brightness?: number;
    };
  } {
    switch (presetId) {
      case 'beep':
        return {
          type: 'beep',
          options: { frequency: 980, duration: 0.08 }
        };
      case 'click':
        return {
          type: 'click',
          options: { frequency: 1800, duration: 0.035 }
        };
      case 'wood_block':
        return {
          type: 'wood',
          options: { frequency: 420, duration: 0.14 }
        };
      case 'wood_clap':
        return {
          type: 'wood',
          options: { frequency: 680, duration: 0.09 }
        };
      case 'shaker':
        return {
          type: 'shaker',
          options: { frequency: 6000, duration: 0.06 }
        };
      case 'tambourine':
        return {
          type: 'tambourine',
          options: { frequency: 2400, duration: 0.17, brightness: 1.8 }
        };
      case 'mechanical':
        return {
          type: 'mechanical',
          options: { frequency: 1450, duration: 0.065 }
        };
      case 'pendulum':
        return {
          type: 'pendulum',
          options: { frequency: 520, duration: 0.18 }
        };
      case 'xylophone':
        return {
          type: 'xylophone',
          options: { frequency: 980, duration: 0.22, brightness: 2.0 }
        };
      case 'marimba':
        return {
          type: 'marimba',
          options: { frequency: 440, duration: 0.24, brightness: 0.9 }
        };
      default:
        return {
          type: 'beep',
          options: { frequency: 980, duration: 0.08 }
        };
    }
  }

  dispose(): void {
    this.clearCache();
    this.soundGenerator = null;
  }
}
