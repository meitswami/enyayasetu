import { useCallback, useRef, useEffect } from 'react';

// Dramatic stinger URLs (using free sound effects)
const STINGER_URLS = {
  objection: 'https://cdn.freesound.org/previews/350/350863_6268774-lq.mp3', // Dramatic hit
  verdict: 'https://cdn.freesound.org/previews/536/536113_3846261-lq.mp3', // Dramatic reveal
  evidence: 'https://cdn.freesound.org/previews/220/220173_1015240-lq.mp3', // Discovery sound
  witness: 'https://cdn.freesound.org/previews/411/411749_5121236-lq.mp3', // Suspense riser
  tension: 'https://cdn.freesound.org/previews/456/456440_8043696-lq.mp3', // Tension build
};

export type StingerType = keyof typeof STINGER_URLS;

interface UseDramaticStingersOptions {
  volume?: number;
  enabled?: boolean;
}

export const useDramaticStingers = (options: UseDramaticStingersOptions = {}) => {
  const { volume = 0.6, enabled = true } = options;
  
  const audioRefs = useRef<Map<StingerType, HTMLAudioElement>>(new Map());

  // Preload all stingers
  useEffect(() => {
    if (!enabled) return;

    Object.entries(STINGER_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.preload = 'auto';
      audioRefs.current.set(key as StingerType, audio);
    });

    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
    };
  }, [enabled, volume]);

  // Update volume on all audio elements
  useEffect(() => {
    audioRefs.current.forEach((audio) => {
      audio.volume = volume;
    });
  }, [volume]);

  const playStinger = useCallback((type: StingerType) => {
    if (!enabled) return;

    const audio = audioRefs.current.get(type);
    if (!audio) return;

    // Clone for overlapping plays
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = volume;
    clone.play().catch(console.error);
  }, [enabled, volume]);

  const playObjection = useCallback(() => playStinger('objection'), [playStinger]);
  const playVerdict = useCallback(() => playStinger('verdict'), [playStinger]);
  const playEvidence = useCallback(() => playStinger('evidence'), [playStinger]);
  const playWitness = useCallback(() => playStinger('witness'), [playStinger]);
  const playTension = useCallback(() => playStinger('tension'), [playStinger]);

  return {
    playStinger,
    playObjection,
    playVerdict,
    playEvidence,
    playWitness,
    playTension,
  };
};
