// src/components/SoundGenerator.ts

import { AudioError, Result } from './soundTypes';

export class SoundGenerator {
  private context: AudioContext;

  constructor(context: AudioContext) {
    this.context = context;
  }

  generateBeepSound(frequency: number = 800, duration: number = 0.1): Result<AudioBuffer> {
    try {
      const sampleRate = this.context.sampleRate;
      const frameCount = Math.floor(duration * sampleRate);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);

      const attackTime = 0.01;
      const decayTime = 0.02;
      const sustainLevel = 0.6;
      const releaseTime = duration - attackTime - decayTime;

      const attackSamples = Math.floor(attackTime * sampleRate);
      const decaySamples = Math.floor(decayTime * sampleRate);
      const releaseSamples = Math.floor(releaseTime * sampleRate);

      for (let i = 0; i < frameCount; i++) {
        const time = i / sampleRate;
        let amplitude: number;

        if (i < attackSamples) {
          amplitude = i / attackSamples;
        } else if (i < attackSamples + decaySamples) {
          const decayProgress = (i - attackSamples) / decaySamples;
          amplitude = 1 - (decayProgress * (1 - sustainLevel));
        } else if (i < frameCount - releaseSamples) {
          amplitude = sustainLevel;
        } else {
          const releaseProgress = (i - (frameCount - releaseSamples)) / releaseSamples;
          amplitude = sustainLevel * (1 - releaseProgress);
        }

        channelData[i] = Math.sin(2 * Math.PI * frequency * time) * amplitude * 0.3;
      }

      return { success: true, data: buffer };
    } catch (error) {
      console.error('Failed to generate beep sound:', error);
      return { 
        success: false, 
        error: AudioError.NodeCreationFailed 
      };
    }
  }

  generateClickSound(frequency: number = 1200, duration: number = 0.05): Result<AudioBuffer> {
    try {
      const sampleRate = this.context.sampleRate;
      const frameCount = Math.floor(duration * sampleRate);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);

      const noiseDecay = 0.95;
      let noiseValue = 0;

      for (let i = 0; i < frameCount; i++) {
        const time = i / sampleRate;
        const envelope = Math.exp(-time * 50);

        const whiteNoise = (Math.random() * 2 - 1);
        noiseValue = noiseValue * noiseDecay + whiteNoise * (1 - noiseDecay);

        const toneComponent = Math.sin(2 * Math.PI * frequency * time) * 0.3;
        const clickComponent = Math.sin(2 * Math.PI * frequency * 2 * time) * 0.1;

        channelData[i] = (noiseValue * 0.6 + toneComponent + clickComponent) * envelope * 0.5;
      }

      return { success: true, data: buffer };
    } catch (error) {
      console.error('Failed to generate click sound:', error);
      return { 
        success: false, 
        error: AudioError.NodeCreationFailed 
      };
    }
  }

  generateWoodSound(pitch: number = 400, duration: number = 0.15): Result<AudioBuffer> {
    try {
      const sampleRate = this.context.sampleRate;
      const frameCount = Math.floor(duration * sampleRate);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        const time = i / sampleRate;
        
        const attackEnv = Math.exp(-time * 80);
        const resonanceEnv = Math.exp(-time * 15) * Math.sin(2 * Math.PI * 3 * time);
        
        const fundamental = Math.sin(2 * Math.PI * pitch * time);
        const harmonic2 = Math.sin(2 * Math.PI * pitch * 1.59 * time) * 0.7;
        const harmonic3 = Math.sin(2 * Math.PI * pitch * 2.13 * time) * 0.4;
        const harmonic4 = Math.sin(2 * Math.PI * pitch * 2.67 * time) * 0.2;
        
        const noise = (Math.random() * 2 - 1) * 0.1 * attackEnv;
        
        const mixedSignal = fundamental + harmonic2 + harmonic3 + harmonic4 + noise;
        channelData[i] = mixedSignal * (attackEnv * 0.7 + resonanceEnv * 0.3) * 0.4;
      }

      return { success: true, data: buffer };
    } catch (error) {
      console.error('Failed to generate wood sound:', error);
      return { 
        success: false, 
        error: AudioError.NodeCreationFailed 
      };
    }
  }

  generateMetallicSound(
    fundamentalFreq: number = 800, 
    duration: number = 0.2,
    brightness: number = 1.0
  ): Result<AudioBuffer> {
    try {
      const sampleRate = this.context.sampleRate;
      const frameCount = Math.floor(duration * sampleRate);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        const time = i / sampleRate;
        
        const mainEnv = Math.exp(-time * 8);
        const shimmerEnv = Math.exp(-time * 3) * (1 + Math.sin(2 * Math.PI * 7 * time) * 0.3);
        
        const partials = [
          { freq: fundamentalFreq, amp: 1.0 },
          { freq: fundamentalFreq * 1.618, amp: 0.8 },
          { freq: fundamentalFreq * 2.236, amp: 0.6 },
          { freq: fundamentalFreq * 3.141, amp: 0.4 },
          { freq: fundamentalFreq * 4.472, amp: 0.2 },
        ];
        
        let signal = 0;
        partials.forEach(partial => {
          const phase = 2 * Math.PI * partial.freq * time;
          signal += Math.sin(phase) * partial.amp * brightness;
        });
        
        const metalNoise = (Math.random() * 2 - 1) * 0.05 * mainEnv * brightness;
        
        channelData[i] = (signal + metalNoise) * mainEnv * shimmerEnv * 0.3;
      }

      return { success: true, data: buffer };
    } catch (error) {
      console.error('Failed to generate metallic sound:', error);
      return { 
        success: false, 
        error: AudioError.NodeCreationFailed 
      };
    }
  }

  generateSoundByType(
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
      | 'xylophone',
    options: {
      frequency?: number;
      duration?: number;
      brightness?: number;
    } = {}
  ): Result<AudioBuffer> {
    const {
      frequency = 800,
      duration = 0.1,
      brightness = 1.0
    } = options;

    switch (type) {
      case 'beep':
        return this.generateBeepSound(frequency, duration);
      case 'click':
        return this.generateClickSound(frequency, duration);
      case 'wood':
        return this.generateWoodSound(frequency, duration);
      case 'metallic':
        return this.generateMetallicSound(frequency, duration, brightness);
      case 'shaker':
        return this.generateShakerSound(frequency, duration);
      case 'tambourine':
        return this.generateTambourineSound(frequency, duration, brightness);
      case 'mechanical':
        return this.generateMechanicalTickSound(frequency, duration);
      case 'pendulum':
        return this.generatePendulumSound(frequency, duration);
      case 'marimba':
        return this.generateMarimbaSound(frequency, duration, brightness);
      case 'xylophone':
        return this.generateXylophoneSound(frequency, duration, brightness);
      default:
        return {
          success: false,
          error: AudioError.InvalidSettings
        };
    }
  }

  private generateShakerSound(centerFreq: number = 6000, duration: number = 0.06): Result<AudioBuffer> {
    try {
      const sampleRate = this.context.sampleRate;
      const frameCount = Math.floor(duration * sampleRate);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);

      let prevWhite = 0;
      let prevHp = 0;
      const hpCoeff = 0.992;
      const tonal = centerFreq / 3;

      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 70);
        const white = Math.random() * 2 - 1;
        const hp = white - prevWhite + hpCoeff * prevHp;
        prevWhite = white;
        prevHp = hp;
        const sparkle = Math.sin(2 * Math.PI * tonal * t) * 0.08 * env;
        channelData[i] = (hp * 0.72 + sparkle) * env * 0.55;
      }

      return { success: true, data: buffer };
    } catch (error) {
      console.error('Failed to generate shaker sound:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }

  private generateTambourineSound(
    baseFreq: number = 2400,
    duration: number = 0.17,
    brightness: number = 1.8
  ): Result<AudioBuffer> {
    try {
      const sampleRate = this.context.sampleRate;
      const frameCount = Math.floor(duration * sampleRate);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);
      const partials = [1.0, 1.42, 1.91, 2.57, 3.16];

      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        const burst1 = Math.exp(-t * 45);
        const burst2 = t > 0.028 ? Math.exp(-(t - 0.028) * 55) * 0.55 : 0;
        const env = burst1 + burst2;

        let tonal = 0;
        for (let p = 0; p < partials.length; p++) {
          tonal += Math.sin(2 * Math.PI * baseFreq * partials[p] * t) * (1 / (p + 1));
        }
        const noise = (Math.random() * 2 - 1) * 0.12;
        channelData[i] = (tonal * 0.22 * brightness + noise) * env * 0.55;
      }

      return { success: true, data: buffer };
    } catch (error) {
      console.error('Failed to generate tambourine sound:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }

  private generateMechanicalTickSound(frequency: number = 1450, duration: number = 0.065): Result<AudioBuffer> {
    try {
      const sampleRate = this.context.sampleRate;
      const frameCount = Math.floor(duration * sampleRate);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        const transient = Math.exp(-t * 170);
        const ring = Math.exp(-t * 35);
        const clickNoise = (Math.random() * 2 - 1) * 0.24 * transient;
        const tick = Math.sin(2 * Math.PI * frequency * t) * ring;
        const metal = Math.sin(2 * Math.PI * frequency * 2.25 * t) * ring * 0.22;
        channelData[i] = (clickNoise + tick * 0.5 + metal) * 0.58;
      }

      return { success: true, data: buffer };
    } catch (error) {
      console.error('Failed to generate mechanical tick sound:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }

  private generatePendulumSound(frequency: number = 520, duration: number = 0.18): Result<AudioBuffer> {
    try {
      const sampleRate = this.context.sampleRate;
      const frameCount = Math.floor(duration * sampleRate);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        const env1 = Math.exp(-t * 25);
        const env2 = t > 0.045 ? Math.exp(-(t - 0.045) * 30) * 0.38 : 0;
        const env = env1 + env2;
        const body = Math.sin(2 * Math.PI * frequency * t) * 0.55;
        const upper = Math.sin(2 * Math.PI * frequency * 2.03 * t) * 0.18;
        const woodNoise = (Math.random() * 2 - 1) * 0.05 * env1;
        channelData[i] = (body + upper + woodNoise) * env * 0.5;
      }

      return { success: true, data: buffer };
    } catch (error) {
      console.error('Failed to generate pendulum sound:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }

  private generateMarimbaSound(
    frequency: number = 440,
    duration: number = 0.24,
    brightness: number = 0.9
  ): Result<AudioBuffer> {
    try {
      const sampleRate = this.context.sampleRate;
      const frameCount = Math.floor(duration * sampleRate);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        const attack = 1 - Math.exp(-t * 120);
        const decay = Math.exp(-t * 12);
        const env = attack * decay;

        const fundamental = Math.sin(2 * Math.PI * frequency * t);
        const overtone1 = Math.sin(2 * Math.PI * frequency * 3.01 * t) * 0.35 * brightness;
        const overtone2 = Math.sin(2 * Math.PI * frequency * 4.17 * t) * 0.22 * brightness;
        const woodBody = Math.sin(2 * Math.PI * frequency * 0.5 * t) * 0.12;
        channelData[i] = (fundamental * 0.65 + overtone1 + overtone2 + woodBody) * env * 0.62;
      }

      return { success: true, data: buffer };
    } catch (error) {
      console.error('Failed to generate marimba sound:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }

  private generateXylophoneSound(
    frequency: number = 980,
    duration: number = 0.22,
    brightness: number = 2.0
  ): Result<AudioBuffer> {
    try {
      const sampleRate = this.context.sampleRate;
      const frameCount = Math.floor(duration * sampleRate);
      const buffer = this.context.createBuffer(1, frameCount, sampleRate);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 20);
        const strike = Math.exp(-t * 130);
        const fundamental = Math.sin(2 * Math.PI * frequency * t) * 0.55;
        const bright1 = Math.sin(2 * Math.PI * frequency * 2.7 * t) * 0.35 * brightness;
        const bright2 = Math.sin(2 * Math.PI * frequency * 4.35 * t) * 0.22 * brightness;
        const ping = (Math.random() * 2 - 1) * 0.08 * strike;
        channelData[i] = (fundamental + bright1 + bright2 + ping) * env * 0.5;
      }

      return { success: true, data: buffer };
    } catch (error) {
      console.error('Failed to generate xylophone sound:', error);
      return {
        success: false,
        error: AudioError.NodeCreationFailed
      };
    }
  }
}
