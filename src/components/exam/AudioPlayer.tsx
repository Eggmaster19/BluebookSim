import React, { useState, useRef } from 'react';

interface AudioPlayerProps {
  src: string;
  maxPlays?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, maxPlays }) => {
  const [playCount, setPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // If a raw filename is provided rather than a blob or absolute url, assume it's in public/audio/ (for dummy data)
  const audioSrc = src.startsWith('blob:') || src.startsWith('http') || src.startsWith('data:') 
    ? src 
    : `/audio/${src}`;

  const handlePlay = () => {
    if (maxPlays && playCount >= maxPlays) {
      return; // Can't play anymore
    }
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setPlayCount(prev => prev + 1);
  };

  const remainingPlays = maxPlays !== undefined ? maxPlays - playCount : null;
  const isDisabled = maxPlays !== undefined && playCount >= maxPlays;

  return (
    <div className="bb-audio-player" style={{
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '12px',
      margin: '16px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      backgroundColor: '#f8f9fa'
    }}>
      <audio 
        ref={audioRef} 
        src={audioSrc} 
        onEnded={handleEnded} 
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      
      <button 
        onClick={isPlaying ? handlePause : handlePlay}
        disabled={isDisabled && !isPlaying}
        style={{
          padding: '8px 16px',
          backgroundColor: isDisabled && !isPlaying ? '#ccc' : '#0070c0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isDisabled && !isPlaying ? 'not-allowed' : 'pointer'
        }}
      >
        {isPlaying ? 'Pause' : 'Play Audio'}
      </button>
      
      <div style={{ fontSize: '14px', color: '#555' }}>
        {remainingPlays !== null ? (
          <span>Plays remaining: <strong>{remainingPlays}</strong></span>
        ) : (
          <span>Audio Clip</span>
        )}
      </div>
    </div>
  );
};
