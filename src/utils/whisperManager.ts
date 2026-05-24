import { useExamStore } from '../store/examStore';
import type { WhisperMessage, WhisperResponse } from '../workers/whisper.worker';

class WhisperManager {
  private worker: Worker | null = null;
  private isThrottled = true;

  init() {
    if (this.worker) return;
    this.worker = new Worker(new URL('../workers/whisper.worker.ts', import.meta.url), {
      type: 'module'
    });

    this.worker.onmessage = (e: MessageEvent<WhisperResponse>) => {
      const msg = e.data;
      if (msg.type === 'transcription') {
        useExamStore.getState().setAudioTranscription(msg.id, msg.text);
      } else if (msg.type === 'transcription_error') {
        console.error(`Transcription error for ${msg.id}:`, msg.error);
        useExamStore.getState().setAudioTranscription(msg.id, '[Transcription Failed]');
      }
    };

    // Preload model
    this.worker.postMessage({ type: 'load', model: 'onnx-community/whisper-small' } as WhisperMessage);
  }

  setThrottle(throttle: boolean) {
    if (!this.worker) this.init();
    this.isThrottled = throttle;
    this.worker!.postMessage({ type: 'set_throttle', throttle } as WhisperMessage);
  }

  transcribe(id: string, audioData: Float32Array) {
    if (!this.worker) this.init();
    this.worker!.postMessage({ type: 'transcribe', id, audioData, throttle: this.isThrottled } as WhisperMessage);
  }
}

export const whisperManager = new WhisperManager();
