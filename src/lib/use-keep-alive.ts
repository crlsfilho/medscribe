import { useState, useCallback, useRef, useEffect } from 'react';

// Generates a silent audio buffer (1 second of silence)
const createSilentAudio = (context: AudioContext) => {
  const buffer = context.createBuffer(1, context.sampleRate * 1, context.sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < channelData.length; i++) {
    channelData[i] = 0; // complete silence
  }
  return buffer;
};

export function useKeepAlive() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Fallback: Using HTML5 Audio with a silent loop if WebAudio is restricted
  const setupAudioFallback = useCallback(() => {
    if (!audioElRef.current && typeof window !== 'undefined') {
      const audio = new Audio();
      // Base64 of a 1-second silent MP3/WAV
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      audio.loop = true;
      audio.volume = 0; 
      audioElRef.current = audio;
    }
  }, []);

  const enableKeepAlive = useCallback(async () => {
    setIsActive(true);

    // 1. Try Screen Wake Lock API (Supported in Chrome/Edge, not iOS Safari)
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        
        // Re-request on visibility change (wake locks drop when tab is hidden)
        const handleVisibilityChange = async () => {
          if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
      } catch (err) {
        console.warn('Wake Lock request failed or not supported:', err);
      }
    }

    // 2. Try Web Audio API (Silent oscillator) - Helps prevent Safari from throttling the tab
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createBufferSource();
        source.buffer = createSilentAudio(ctx);
        source.loop = true;
        source.connect(ctx.destination);
        source.start();
        audioSourceRef.current = source;
      }
    } catch (e) {
      console.warn('Web Audio Keep-Alive failed:', e);
      // Try fallback
      setupAudioFallback();
      if (audioElRef.current) {
         audioElRef.current.play().catch(e => console.warn('Audio fallback played failed', e));
      }
    }
  }, [setupAudioFallback]);

  const disableKeepAlive = useCallback(() => {
    setIsActive(false);

    // 1. Release Wake Lock
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
        .then(() => { wakeLockRef.current = null; })
        .catch(console.warn);
    }

    // 2. Stop Web Audio
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(console.warn);
      audioCtxRef.current = null;
    }

    // 3. Stop HTML Audio fallback
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disableKeepAlive();
    };
  }, [disableKeepAlive]);

  return { enableKeepAlive, disableKeepAlive, isKeepAliveActive: isActive };
}
