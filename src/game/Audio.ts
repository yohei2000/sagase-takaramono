export class GameAudio {
  private context: AudioContext | null = null;

  unlock(): void {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    if (!this.context) {
      this.context = new AudioContextClass();
    }

    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
  }

  coin(): void {
    this.playTone(880, 0.08, 'sine', 0, 0.13);
    this.playTone(1320, 0.08, 'sine', 0.08, 0.1);
  }

  hint(): void {
    [980, 1240, 1560].forEach((frequency, index) => {
      this.playTone(frequency, 0.1, 'triangle', index * 0.07, 0.11);
    });
  }

  success(): void {
    [523, 659, 784, 1046].forEach((frequency, index) => {
      this.playTone(frequency, 0.12, 'triangle', index * 0.09, 0.13);
    });
  }

  treasure(): void {
    [523, 659, 784, 1046, 1318, 1568].forEach((frequency, index) => {
      this.playTone(frequency, 0.17, index % 2 ? 'sine' : 'triangle', index * 0.11, 0.14);
    });
  }

  lose(): void {
    [440, 392, 349].forEach((frequency, index) => {
      this.playTone(frequency, 0.18, 'sine', index * 0.16, 0.1);
    });
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    delay: number,
    volume: number
  ): void {
    if (!this.context) {
      return;
    }

    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
