import React, { useState, useEffect, useRef } from 'react';
import { useExamStore } from '../../store/examStore';
import type { AudioResponseQuestion } from '../../types/ExamSchema';
import { processRecordingForTranscription } from '../../utils/audioProcessor';
import { whisperManager } from '../../utils/whisperManager';

interface AudioRecorderProps {
  question: AudioResponseQuestion;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ question }) => {
  const setAudioRecording = useExamStore((s) => s.setAudioRecording);
  const [phase, setPhase] = useState<'initial' | 'prep' | 'interlocutor' | 'recording' | 'done'>('initial');
  const [countdown, setCountdown] = useState<number>(0);
  const [currentWindowIndex, setCurrentWindowIndex] = useState(0);
  
  const currentWindowIndexRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const interlocutorAudioRef = useRef<HTMLAudioElement | null>(null);

  // Is it Q1 (single long recording) or Q2 (multiple short windows with interlocutor)?
  const isMultiWindow = question.recordingWindows && question.recordingWindows > 1;

  useEffect(() => {
    whisperManager.init();
    return () => {
      if (interlocutorAudioRef.current) {
        interlocutorAudioRef.current.pause();
        interlocutorAudioRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startPrep = () => {
    if (question.prepTimeMinutes) {
      setPhase('prep');
      setCountdown(question.prepTimeMinutes * 60);
    } else {
      advanceFlow();
    }
  };

  const advanceFlow = () => {
    if (isMultiWindow) {
      const audioUrl = question.interlocutorAudio?.[currentWindowIndexRef.current];
      if (audioUrl) {
        setPhase('interlocutor');
        const audioSrc = audioUrl.startsWith('blob:') || audioUrl.startsWith('http') || audioUrl.startsWith('data:') 
          ? audioUrl : `/audio/${audioUrl}`;
        interlocutorAudioRef.current = new Audio(audioSrc);
        interlocutorAudioRef.current.onended = () => {
          startRecording(question.windowDurationSeconds || 40);
        };
        interlocutorAudioRef.current.play();
      } else {
        startRecording(question.windowDurationSeconds || 40);
      }
    } else {
      startRecording((question.recordingTimeMinutes || 3) * 60);
    }
  };

  const startRecording = async (durationSecs: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Process audio in background
        const recordId = isMultiWindow ? `${question.id}-part${currentWindowIndexRef.current + 1}` : question.id;
        
        try {
          const { mp3Blob, trimmedBuffer } = await processRecordingForTranscription(blob);
          const mp3Url = URL.createObjectURL(mp3Blob);
          setAudioRecording(recordId, mp3Url);
          
          whisperManager.transcribe(recordId, trimmedBuffer.getChannelData(0));
        } catch (err) {
          console.error("Failed to process audio recording", err);
        }

        if (isMultiWindow) {
          if (currentWindowIndexRef.current + 1 < (question.recordingWindows || 0)) {
            currentWindowIndexRef.current += 1;
            setCurrentWindowIndex(currentWindowIndexRef.current);
            advanceFlow();
          } else {
            setPhase('done');
          }
        } else {
          setPhase('done');
        }
      };

      setPhase('recording');
      setCountdown(durationSecs);
      recorder.start();

    } catch (err) {
      console.error("Microphone access denied or failed", err);
      alert("Microphone access is required for this section.");
    }
  };

  useEffect(() => {
    if (countdown > 0 && (phase === 'prep' || phase === 'recording')) {
      const timerId = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (countdown === 0) {
      if (phase === 'prep') {
        advanceFlow();
      } else if (phase === 'recording') {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }
    }
  }, [countdown, phase]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bb-audio-recorder" style={{
      border: '2px solid #ccc',
      borderRadius: '8px',
      padding: '24px',
      textAlign: 'center',
      backgroundColor: '#f9f9f9',
      marginTop: '20px'
    }}>
      <h3 style={{ marginBottom: '16px', fontSize: '20px' }}>Recording Task</h3>

      {phase === 'initial' && (
        <div>
          <p>Click below to begin the task. Have your microphone ready.</p>
          <button onClick={startPrep} style={{
            padding: '12px 24px',
            backgroundColor: '#0070c0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '16px'
          }}>
            Begin Task
          </button>
        </div>
      )}

      {phase === 'prep' && (
        <div>
          <div style={{ color: '#d9534f', fontSize: '18px', fontWeight: 'bold' }}>
            Preparation Time
          </div>
          <div style={{ fontSize: '48px', margin: '16px 0', fontFamily: 'monospace' }}>
            {formatTime(countdown)}
          </div>
          <p>Read the prompt and prepare your response.</p>
        </div>
      )}

      {phase === 'interlocutor' && (
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0070c0' }}>
            Listen to the question...
          </div>
          <p style={{ marginTop: '16px' }}>Part {currentWindowIndex + 1} of {question.recordingWindows}</p>
        </div>
      )}

      {phase === 'recording' && (
        <div>
          <div style={{ color: '#d9534f', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ 
              display: 'inline-block', width: '12px', height: '12px', 
              backgroundColor: '#d9534f', borderRadius: '50%',
              animation: 'blink 1s infinite'
            }}></span>
            Recording...
          </div>
          <div style={{ fontSize: '48px', margin: '16px 0', fontFamily: 'monospace' }}>
            {formatTime(countdown)}
          </div>
          {isMultiWindow && <p>Part {currentWindowIndex + 1} of {question.recordingWindows}</p>}
        </div>
      )}

      {phase === 'done' && (
        <div>
          <div style={{ color: '#5cb85c', fontSize: '18px', fontWeight: 'bold' }}>
            Task Complete
          </div>
          <p style={{ marginTop: '16px' }}>Your response has been recorded and saved.</p>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
