import { pipeline, env, AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';

// Configure environment
env.allowLocalModels = false; // We'll pull from Hugging Face hub
// User has a 12-thread i5. Cap to 8 threads (throttled/background) to be safe initially;
// updated to 10 when unthrottled so Whisper can near-max the CPU when nothing else is competing.
if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 8;

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;
let isThrottled = true;

// Define message types
export type WhisperMessage = 
  | { type: 'load'; model: string }
  | { type: 'transcribe'; id: string; audioData: Float32Array; throttle: boolean }
  | { type: 'set_throttle'; throttle: boolean };

export type WhisperResponse = 
  | { type: 'status'; status: 'loading' | 'ready' | 'error'; message?: string }
  | { type: 'transcription'; id: string; text: string }
  | { type: 'transcription_error'; id: string; error: string };

async function getTranscriber(model = 'onnx-community/whisper-small') {
  if (!transcriber) {
    self.postMessage({ type: 'status', status: 'loading', message: `Loading ${model}...` } as WhisperResponse);
    
    // We attempt to use WebGPU, falling back to WASM
    // WebGPU is great for Iris Xe, WASM for CPU fallback
    try {
      transcriber = await pipeline('automatic-speech-recognition', model, {
        device: 'webgpu', // Will fallback to 'wasm' if webgpu is unavailable in transformers.js v3 (or we can just omit if it auto-detects, but v3 explicit is good)
        dtype: {
          encoder_model: 'fp32', 
          decoder_model_merged: 'q4', // Quantized for smaller memory footprint
        }
      });
    } catch (err) {
      console.warn("WebGPU initialization failed or not supported, falling back to WASM", err);
      // Fallback to WASM
      // User has 12 threads on their i5. 8 throttled keeps it background-safe; 10 unthrottled
      // lets Whisper near-max the CPU when the exam is done and nothing else is competing.
      if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = isThrottled ? 8 : 10;
      
      transcriber = await pipeline('automatic-speech-recognition', model, {
        device: 'wasm',
        dtype: 'q8' // Quantized model
      });
    }
    
    self.postMessage({ type: 'status', status: 'ready' } as WhisperResponse);
  }
  return transcriber;
}

// A simple delay function to yield to the event loop
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

self.onmessage = async (e: MessageEvent<WhisperMessage>) => {
  const msg = e.data;
  
  if (msg.type === 'set_throttle') {
    isThrottled = msg.throttle;
    if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = isThrottled ? 8 : 10;
    return;
  }
  
  if (msg.type === 'load') {
    try {
      await getTranscriber(msg.model);
    } catch (error: any) {
      self.postMessage({ type: 'status', status: 'error', message: error.message } as WhisperResponse);
    }
    return;
  }
  
  if (msg.type === 'transcribe') {
    try {
      const pipeline = await getTranscriber();
      
      // If throttled, we introduce a delay before starting the heavy compute
      // This allows the main UI thread (and exam) to stay responsive.
      // Transformers.js runs synchronously in the worker, so we can't yield *during* a single forward pass easily,
      // but if we are processing multiple chunks, we could. For simplicity, we just add a delay here,
      // and rely on the worker thread being isolated. Note that WASM can max out CPU cores, causing OS-level slowdowns.
      if (isThrottled) {
        await delay(500); 
      }
      
      const output = await pipeline(msg.audioData, {
        chunk_length_s: 30, // process in 30s chunks
        stride_length_s: 5,
        language: 'german',
        task: 'transcribe',
        return_timestamps: false
      });
      
      self.postMessage({
        type: 'transcription',
        id: msg.id,
        text: Array.isArray(output) ? output.map(o => (o as any).text).join(' ') : (output as any).text
      } as WhisperResponse);
      
    } catch (error: any) {
      console.error(error);
      self.postMessage({
        type: 'transcription_error',
        id: msg.id,
        error: error.message
      } as WhisperResponse);
    }
  }
};
