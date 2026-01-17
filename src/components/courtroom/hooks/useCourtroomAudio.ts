import { useRef, useEffect, useCallback, useState } from 'react';

// Pre-loaded audio URLs (using free sound effects)
const GAVEL_SOUNDS = [
  'https://cdn.freesound.org/previews/607/607329_6399949-lq.mp3',
];

const AMBIANCE_URL = 'https://cdn.freesound.org/previews/530/530111_8164360-lq.mp3';

interface UseCourtroomAudioOptions {
  enableAmbiance?: boolean;
  ambianceVolume?: number;
  effectsVolume?: number;
}

export const useCourtroomAudio = (options: UseCourtroomAudioOptions = {}) => {
  const {
    enableAmbiance = true,
    ambianceVolume = 0.15,
    effectsVolume = 0.5,
  } = options;

  const ambianceRef = useRef<HTMLAudioElement | null>(null);
  const gavelAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAmbiancePlaying, setIsAmbiancePlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize audio elements
  useEffect(() => {
    // Preload gavel sound
    const gavelAudio = new Audio(GAVEL_SOUNDS[0]);
    gavelAudio.volume = effectsVolume;
    gavelAudio.preload = 'auto';
    gavelAudioRef.current = gavelAudio;

    // Initialize ambiance
    if (enableAmbiance) {
      const ambianceAudio = new Audio(AMBIANCE_URL);
      ambianceAudio.loop = true;
      ambianceAudio.volume = ambianceVolume;
      ambianceAudio.preload = 'auto';
      ambianceRef.current = ambianceAudio;
    }

    return () => {
      if (ambianceRef.current) {
        ambianceRef.current.pause();
        ambianceRef.current = null;
      }
      if (gavelAudioRef.current) {
        gavelAudioRef.current = null;
      }
    };
  }, [enableAmbiance, ambianceVolume, effectsVolume]);

  // Play gavel sound
  const playGavel = useCallback(() => {
    if (isMuted || !gavelAudioRef.current) return;
    
    // Clone and play to allow overlapping sounds
    const gavelClone = gavelAudioRef.current.cloneNode() as HTMLAudioElement;
    gavelClone.volume = effectsVolume;
    gavelClone.play().catch(console.error);
  }, [isMuted, effectsVolume]);

  // Start ambiance
  const startAmbiance = useCallback(() => {
    if (!ambianceRef.current || isAmbiancePlaying) return;
    
    ambianceRef.current.play()
      .then(() => setIsAmbiancePlaying(true))
      .catch((err) => {
        console.log('Ambiance autoplay blocked, will start on interaction:', err);
      });
  }, [isAmbiancePlaying]);

  // Stop ambiance
  const stopAmbiance = useCallback(() => {
    if (!ambianceRef.current) return;
    
    ambianceRef.current.pause();
    setIsAmbiancePlaying(false);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (ambianceRef.current) {
        ambianceRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  // Update ambiance volume
  const setAmbianceVolume = useCallback((volume: number) => {
    if (ambianceRef.current) {
      ambianceRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  return {
    playGavel,
    startAmbiance,
    stopAmbiance,
    toggleMute,
    setAmbianceVolume,
    isAmbiancePlaying,
    isMuted,
  };
};
