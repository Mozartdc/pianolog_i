type BeatStrength = 0 | 1 | 2 | 'A';

interface BackgroundMetronomeConfig {
  bpm: number;
  numerator: number;
  denominator: number;
  beatPattern: BeatStrength[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const writeString = (view: DataView, offset: number, text: string) => {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
};

const audioBufferToWavBlob = (input: Float32Array, sampleRate: number): Blob => {
  const channelCount = 1;
  const bitsPerSample = 16;
  const blockAlign = (channelCount * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = input.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < input.length; i += 1) {
    const s = clamp(input[i], -1, 1);
    const v = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, v, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
};

const buildLoopPcm = (config: BackgroundMetronomeConfig, sampleRate = 44100): Float32Array => {
  const quarterDurationSec = 60 / config.bpm;
  const beatDurationSec = quarterDurationSec * (4 / config.denominator);
  const barDurationSec = beatDurationSec * config.numerator;
  const frameCount = Math.max(1, Math.floor(barDurationSec * sampleRate));
  const samples = new Float32Array(frameCount);

  const clickDurationSec = 0.03;
  const clickFrames = Math.floor(clickDurationSec * sampleRate);

  const getFrequency = (strength: BeatStrength): number | null => {
    if (strength === 0) return null;
    if (strength === 'A') return 2000;
    if (strength === 2) return 1500;
    return 1050;
  };

  for (let beat = 0; beat < config.numerator; beat += 1) {
    const strength = config.beatPattern[beat] ?? (beat === 0 ? 'A' : 2);
    const freq = getFrequency(strength);
    if (!freq) continue;

    const startFrame = Math.floor(beat * beatDurationSec * sampleRate);
    for (let i = 0; i < clickFrames; i += 1) {
      const frame = startFrame + i;
      if (frame >= frameCount) break;
      const t = i / sampleRate;
      const attack = clamp(i / (0.003 * sampleRate), 0, 1);
      const release = Math.exp(-20 * t);
      const env = attack * release;
      samples[frame] += Math.sin(2 * Math.PI * freq * t) * env * 0.5;
    }
  }

  return samples;
};

export class BackgroundMetronomePlayer {
  private audio: HTMLAudioElement | null = null;
  private activeUrl: string | null = null;
  private isRunning = false;

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.preload = 'auto';
      (this.audio as HTMLMediaElement & { playsInline?: boolean }).playsInline = true;
      this.audio.crossOrigin = 'anonymous';
      this.audio.style.display = 'none';
      if (typeof document !== 'undefined') {
        document.body.appendChild(this.audio);
      }
    }
    return this.audio;
  }

  private refreshMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Metronome',
      artist: '피출앱'
    });
  }

  private trySetAudioSessionPlayback(): void {
    const nav = navigator as Navigator & {
      audioSession?: { type: 'auto' | 'playback' | 'ambient' };
    };
    if (nav.audioSession) {
      nav.audioSession.type = 'playback';
    }
  }

  async start(config: BackgroundMetronomeConfig): Promise<void> {
    const audio = this.ensureAudio();
    this.trySetAudioSessionPlayback();
    this.refreshMediaSession();

    const pcm = buildLoopPcm(config);
    const blob = audioBufferToWavBlob(pcm, 44100);
    const url = URL.createObjectURL(blob);

    if (this.activeUrl) {
      URL.revokeObjectURL(this.activeUrl);
    }
    this.activeUrl = url;
    audio.src = url;

    await audio.play();
    this.isRunning = true;
  }

  async update(config: BackgroundMetronomeConfig): Promise<void> {
    if (!this.isRunning) return;
    await this.start(config);
  }

  stop(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isRunning = false;
  }

  dispose(): void {
    this.stop();
    if (this.activeUrl) {
      URL.revokeObjectURL(this.activeUrl);
      this.activeUrl = null;
    }
    if (this.audio) {
      this.audio.remove();
      this.audio = null;
    }
  }
}
