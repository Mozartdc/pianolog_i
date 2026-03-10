// src/components/soundTypes.ts

export type SoundCategory = 'wood' | 'percussion' | 'digital' | 'mechanical' | 'marimba';

export interface SoundPreset {
  id: string;
  category: SoundCategory;
  name: string;
  description: string;
  audioFile?: string;
  generateFn?: () => AudioBuffer;
}

export interface SoundSettings {
  presetId: string;
  volume: number; // from 0 to 1
  accentGain: number; // from 1.0 to 2.0
  muteWeakBeats: boolean;
  attackTime: number; // 0 to 50ms
  releaseTime: number; // 50 to 500ms
  reverb: number; // 0 to 100
  lowpass: number; // 1000 to 20000Hz
  lookaheadMs: number; // 25 to 200ms
  windowMs: number; // 50 to 500ms
}

export interface PreviewOptions {
  type: 'single' | 'pattern' | 'subdivision';
  accent?: 'strong' | 'weak';
  steps?: number;
  bars?: number;
}

export enum AudioError {
  ContextCreationFailed = 'ContextCreationFailed',
  NodeCreationFailed = 'NodeCreationFailed',
  InvalidSettings = 'InvalidSettings',
  FileLoadFailed = 'FileLoadFailed',
  UnsupportedFormat = 'UnsupportedFormat'
}

export type Result<T, E = AudioError> = 
  | { success: true; data: T } 
  | { success: false; error: E };

export const SOUND_PRESETS: SoundPreset[] = [
  // Wood block sounds
  {
    id: 'wood_block',
    category: 'wood',
    name: '우드 블록',
    description: '클래식 우드 사운드'
  },
  {
    id: 'wood_clap',
    category: 'wood',
    name: '클랩스틱',
    description: '드럼스틱 타격음'
  },
  
  // Shaker and tambourine sounds
  {
    id: 'shaker',
    category: 'percussion',
    name: '셰이커',
    description: '부드러운 리듬감'
  },
  {
    id: 'tambourine',
    category: 'percussion',
    name: '탬버린',
    description: '밝은 금속 사운드'
  },
  
  // Digital sounds
  {
    id: 'beep',
    category: 'digital',
    name: '비프',
    description: '전자 신호음'
  },
  {
    id: 'click',
    category: 'digital',
    name: '클릭',
    description: '디지털 클릭 사운드'
  },
  
  // Mechanical metronome sounds
  {
    id: 'mechanical',
    category: 'mechanical',
    name: '기계식',
    description: '전통 메트로놈',
    audioFile: '/sounds/mechanical_strong.wav'
  },
  {
    id: 'mechanical_accent',
    category: 'mechanical',
    name: '기계식 강박',
    description: '기계식 강박 샘플',
    audioFile: '/sounds/mechanical_accent.wav'
  },
  {
    id: 'mechanical_weak',
    category: 'mechanical',
    name: '기계식 약박',
    description: '기계식 약박 샘플',
    audioFile: '/sounds/mechanical_weak.wav'
  },
  {
    id: 'pendulum',
    category: 'mechanical',
    name: '진자',
    description: '진자 소리'
  },
  
  // Marimba sounds
  {
    id: 'marimba',
    category: 'marimba',
    name: '마림바',
    description: '따뜻한 목관 타악기'
  },
  {
    id: 'xylophone',
    category: 'marimba',
    name: '실로폰',
    description: '밝은 금속 타악기'
  }
];

export const CATEGORY_LABELS: Record<SoundCategory, string> = {
  wood: '우드 블록',
  percussion: '퍼커션',
  digital: '디지털',
  mechanical: '기계식',
  marimba: '마림바'
};

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  presetId: 'mechanical',
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
