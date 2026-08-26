export function pcmToBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export class AudioPlayer {
  private ctx: AudioContext;
  private nextStartTime: number = 0;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(this.ctx.destination);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  getVolume(): number {
    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return sum / this.dataArray.length;
  }

  playChunk(base64Audio: string) {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const binary = atob(base64Audio);
    const bytes = new Int16Array(binary.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      const byteA = binary.charCodeAt(i * 2);
      const byteB = binary.charCodeAt(i * 2 + 1);
      bytes[i] = (byteB << 8) | byteA;
    }

    const buffer = this.ctx.createBuffer(1, bytes.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < bytes.length; i++) {
      channelData[i] = bytes[i] / 32768.0;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser);

    if (this.nextStartTime < this.ctx.currentTime) {
      this.nextStartTime = this.ctx.currentTime + 0.05;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  interrupt() {
    this.ctx.close();
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(this.ctx.destination);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.nextStartTime = 0;
  }
  
  close() {
    this.ctx.close();
  }
}
