// 効果音管理

type SoundType = 'type' | 'correct' | 'miss' | 'win' | 'lose' | 'start' | 'ready';

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Web Audio API でシンプルな効果音を生成
    this.initializeSounds();
  }

  private initializeSounds() {
    // 効果音はブラウザのAudio APIで動的生成
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  play(type: SoundType) {
    if (!this.enabled) return;

    // AudioContext を使用してシンプルなビープ音を生成
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      gainNode.gain.value = this.volume * 0.3;

      switch (type) {
        case 'type':
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.05);
          break;

        case 'correct':
          oscillator.frequency.value = 1200;
          oscillator.type = 'sine';
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
          break;

        case 'miss':
          oscillator.frequency.value = 200;
          oscillator.type = 'square';
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.15);
          break;

        case 'win':
          this.playMelody(audioContext, [523, 659, 784, 1047], 0.15);
          break;

        case 'lose':
          this.playMelody(audioContext, [392, 349, 330, 294], 0.2);
          break;

        case 'start':
          this.playMelody(audioContext, [440, 554, 659], 0.1);
          break;

        case 'ready':
          oscillator.frequency.value = 660;
          oscillator.type = 'sine';
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
      }
    } catch (e) {
      // Audio API がサポートされていない場合は無視
      console.warn('Audio not supported:', e);
    }
  }

  private playMelody(audioContext: AudioContext, frequencies: number[], noteDuration: number) {
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gainNode.gain.value = this.volume * 0.3;

      const startTime = audioContext.currentTime + index * noteDuration;
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration * 0.9);

      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });
  }
}

export const soundManager = new SoundManager();
