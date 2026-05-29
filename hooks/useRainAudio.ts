'use client';

import { useEffect, useRef, useState } from 'react';

export function useRainAudio() {
  const [hasPlayed, setHasPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio element only on client
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
      // Use Web Audio API untuk rain sound (generated, not loaded file)
      audioRef.current.src = 'data:audio/wav;base64,U3RlYWx0aCBzb3VuZ...'; // Base64 rain sound
      audioRef.current.volume = 0.3;
    }
  }, []);
  
  const playRainSound = () => {
    if (audioRef.current && !hasPlayed) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      setHasPlayed(true);
      
      // Reset after 10 seconds (for next rain session)
      setTimeout(() => setHasPlayed(false), 10000);
    }
  };
  
  return { playRainSound, hasPlayed };
}