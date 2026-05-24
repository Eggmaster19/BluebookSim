import * as lamejs from 'lamejs';

// Convert AudioBuffer to 16-bit PCM array (required for lamejs)
function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

// Convert AudioBuffer to MP3 Blob using lamejs
export async function audioBufferToMp3Blob(audioBuffer: AudioBuffer): Promise<Blob> {
  // Lamejs works best with mono. We'll use the first channel.
  const pcmData = floatTo16BitPCM(audioBuffer.getChannelData(0));
  const sampleRate = audioBuffer.sampleRate;
  
  const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // mono, sampleRate, 128kbps
  const mp3Data: Int8Array[] = [];

  const sampleBlockSize = 1152; // multiple of 576
  for (let i = 0; i < pcmData.length; i += sampleBlockSize) {
    const sampleChunk = pcmData.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  const uint8Data = mp3Data.map(buf => new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
  return new Blob(uint8Data as unknown as BlobPart[], { type: 'audio/mp3' });
}

// Remove empty air (silence) from an audio blob and resample to 16kHz
export async function trimSilenceFromAudioBlob(blob: Blob, threshold = 0.01, minDurationSec = 0.1): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  
  // First decode the audio to get its original length
  const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const tempBuffer = await tempContext.decodeAudioData(arrayBuffer.slice(0));
  
  // Now create an offline context at 16000Hz (required by Whisper)
  const targetSampleRate = 16000;
  const offlineContext = new window.OfflineAudioContext(
    1, 
    Math.ceil(tempBuffer.duration * targetSampleRate), 
    targetSampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = tempBuffer;
  source.connect(offlineContext.destination);
  source.start(0);
  
  const audioBuffer = await offlineContext.startRendering();
  const channelData = audioBuffer.getChannelData(0); // process first channel for VAD
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms window
  
  let isSpeaking = false;
  let activeSegments: Float32Array[] = [];
  let currentSegment: number[] = [];
  
  for (let i = 0; i < channelData.length; i += windowSize) {
    const windowEnd = Math.min(i + windowSize, channelData.length);
    let sumSquares = 0;
    
    for (let j = i; j < windowEnd; j++) {
      sumSquares += channelData[j] * channelData[j];
    }
    
    const rms = Math.sqrt(sumSquares / (windowEnd - i));
    
    if (rms > threshold) {
      if (!isSpeaking) isSpeaking = true;
      currentSegment.push(...channelData.slice(i, windowEnd));
    } else {
      if (isSpeaking) {
        // Keep a little bit of silence padding
        currentSegment.push(...channelData.slice(i, windowEnd));
        if (currentSegment.length > minDurationSec * sampleRate) {
           activeSegments.push(new Float32Array(currentSegment));
        }
        currentSegment = [];
        isSpeaking = false;
      }
    }
  }
  
  if (currentSegment.length > 0 && currentSegment.length > minDurationSec * sampleRate) {
    activeSegments.push(new Float32Array(currentSegment));
  }
  
  // Calculate total length of active segments
  const totalLength = activeSegments.reduce((acc, segment) => acc + segment.length, 0);
  
  if (totalLength === 0) {
    // Return empty buffer or the original buffer if everything was silence
    return new window.OfflineAudioContext(1, 1, sampleRate).createBuffer(1, 1, sampleRate);
  }

  // Create new trimmed audio buffer
  const trimmedBuffer = new window.OfflineAudioContext(1, totalLength, sampleRate).createBuffer(1, totalLength, sampleRate);
  const trimmedChannel = trimmedBuffer.getChannelData(0);
  
  let offset = 0;
  for (const segment of activeSegments) {
    trimmedChannel.set(segment, offset);
    offset += segment.length;
  }
  
  return trimmedBuffer;
}

export async function processRecordingForTranscription(blob: Blob): Promise<{ mp3Blob: Blob, trimmedBuffer: AudioBuffer }> {
  // Trim silence
  const trimmedBuffer = await trimSilenceFromAudioBlob(blob);
  
  // Convert trimmed buffer to MP3
  const mp3Blob = await audioBufferToMp3Blob(trimmedBuffer);
  
  return { mp3Blob, trimmedBuffer };
}
