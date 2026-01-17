import { useState, useCallback, useRef, useEffect } from 'react';

// Base64 encoded audio samples for offline use
// These are small placeholder sounds - in production you'd use proper audio files
const OFFLINE_SOUNDS = {
  gavel: {
    // Gavel hit sound - short impact
    dataUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6di4V9d3d9hY2Sjo2HgXp0cXN4f4eMj46LhX94cnBwcHN4foSJjIuHgntzcnF0d36EioyMh4N7dXNzdXl+hIiKi4iEfnl0cnN2e4CGiYqJhYF8dnNzdXl+g4eJiYeDf3l1cnN2e4CEh4iHg399eHRyc3Z6f4OGh4aDf3t2c3J0d3t/g4aGhYF9eHRyc3R4fIGEhoWCf3t2c3F0d3t/goWFg4B7d3Ryc3V4fICDhYSDgHx3dHJzdXh8gIOEg4F9eXVyc3V4fH+Cg4KAfXl1c3N0d3t+gYKCgH15dXNzdHd6fYCBgYB9eXVzc3R2eXyAgIF/fXl1c3J0dnl8foCAfnx4dXNzdXh6fX9/fn15dXNzdXZ5fH5/fnx5dnRzc3Z4en1+fnx6d3Ryc3V3en1+fnx6d3Vzdnd5fH1+fHp4dXNzdXh6fX1+fHp4dXRzdXh6fH1+fHp4dXNzdXd6fH1+fHp4dXNzdXd5e31+fHl3dXNzdXd5e31+fHl3dXNzdHZ4en19fHp4dnRzdXZ4en18fHp4dnRzdXZ4en18fHl3dXRzdXZ5e318e3l3dXRzdXZ5e318e3l3dXNzdXd5e31+e3l3dXN0dXd5e31+e3l3dXN0dXd5en19e3l3dXN0dXd5en19e3l3dXNzdXd5en18e3l3dXN0dXd5en18e3l3dXN0dXd5en18e3l2dHN0dXd5en18e3l2dHN0dXd5en18e3h2dHN0dXd5en18e3h2dHN0dXd5en18e3h2dHN0dXd5en18e3h2dHN0dXd5en18e3h2dHN0dXd5en18e3h2dHN0',
    duration: 0.3,
  },
  tension: {
    // Low rumble tension sound
    dataUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAABzcXJzdHV2eHl6fH1+f4CBgoOEhYaHiImKi4yNjY6Pj5CQkZGSkpKSk5OTk5SUlJSUlJSUlJOTk5OTkpKSkpGRkJCQj4+OjY2MjIuKiYmIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwcG9vbm5tbWxsa2tqamppamppaWlpaWhpaWlpaWlpaWpqamtrbGxsbW1ubm9vcHBxcnJzdHR1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjY6Pj5CQkZGSkpKSk5OTk5SUlJSUlJSUlJOTk5OTkpKSkpGRkJCQj4+OjY2MjIuKiYmIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwcG9vbm5tbWxsa2tqamppamppaWlpaWhpaWlpaWlpaWpqamtrbGxsbW1ubm9vcHBxcnJzdHR1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjY6Pj5CQkZGSkpKSk5OTk5SUlJSUlJSUlJOTk5OTkpKSkpGRkJCQj4+OjY2MjIuKiYmIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwcG9vbm5tbWxsa2tqamppamppaWlpaWhpaWlpaWlpaWpqamtrbGxsbW1ubm9vcHBxcnJzdHR1dnd4eXp7fH1+gA==',
    duration: 1.5,
  },
  objection: {
    // Short dramatic sting
    dataUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgH+AgICBgoOFh4qNkJOWmZyen6Gjpaeoqaqrq6ysra2trq6urq6urq6trK2sq6qpp6WjoJ6bm5eUkY6LiIWCgH59e3p5eHh3d3d3d3h4eXp7fX+BhIeLjpGUl5qdn6Kkpqipqqurqyyrq6urq6usrK2tra2trq6urq6trq2sqqmnpaSioZ2bmJWSkY6LiIaEgoB+fXt6eXh4d3d3d3d4eHl6e31/goSHio2Qk5aZnJ6go6Wmp6ipqqurq6ysrKysrKysra2tra2ura2trq6ura2sqamopqWkoaCenJqYlpOQjouJhoSDgX9+fHt6eXl4eHh4eHl5ent8fn+Bg4aIi42QkpSWmJqbnZ+goqOkpaanqKmpqqqrrKysrKytrq6ura2tra2traysq6qpqKempKKgnpyamJaTkY+Mi4iFhIKAf318e3p5eXh4eHh4eXl6e3x9f4GDhYeKjI+Rk5WWmJqcnp+hoqOkpaampqeoqamqqqurrKysrKysra2tra2traysq6qpqKalpKKgnpyamJaTkY+NiomGhIOBgH9+fHt6enl5eXl5eXp6e3x9f4CCg4WIio2Pk5WXmJqcnp+goqOkpKWlpaanqKiqqqqrq6ysrKysrKysrKyrqqmpqKampKOioJ6cmpiWlJKQjo2LiYiGhIOCgIB/fX18e3t6e3t7e3x8fH1+f4CCg4WHiYuNj5GTlZeZmpydn5+goaGioqOjpKSlpaWmpqampqanp6enp6enp6enp6empqampqWlpKSjo6Khn5+dnJqamJaVk5KQjo2LiYiGhYSDgoGAf39+fn59fX1+fn5/f4CAgYGCg4OEhYWGh4eIiYmJiomKioqKioqKioqKioqKioqKiomJiYmJiYiIiIeHhoaFhYSEg4ODgoKBgYCAf39/fn5+fX19fX19fX19fX1+fn5+f39/gICAgICBgYGBgoKCgoKCgoKCgoKCgoKCgoKCgoKCgYGBgYGBgYCAgICAgH9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f35+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+',
    duration: 0.8,
  },
  evidence: {
    // Paper shuffle/reveal sound
    dataUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgH9+fX19fn+Ag4aJjI+SlZibnqGjpqipq6ytrrCxsrO0tba2t7i4uLi4uLi4t7e2trW0s7KxsK6sqqimpKKfnJqXlJGOi4iFgoB9e3l3dnV0c3NycnJyc3N0dXZ3eXt9f4GDhYeJi42PkZOVlpeYmZqampubm5ycnJycnJycm5ubm5ubmpqamZmYl5aVlJOSkI+NjIqIhoSCgH9+fHt6eXl4eHh4eHl5ent8fX5/gYKDhIaHiYqLjI2Oj5CRkpKTk5SUlJSUlJSUlJSUlJOTk5OSkpKRkZCQj4+OjYyLioqIh4aFhIKBgH9+fXx8e3p6enp6ent7fHx9fn+AgYKDhIWGh4iJiouMjI2OjpCQkJGRkpKSkpKSkpKSkpKSkpKSkZGRkZCQj4+OjY2MjIuKiomIh4aFhIOCgYCAf359fHx8e3t7e3t8fHx9fn5/gIGCg4SFhoeIiImKi4uMjI2OjY6OjpCQkJCQkJCQkJCQj4+Pj4+Pjo6OjY2MjIuLioqJiYiHhoaFhISEg4KCgYCAf39+fn19fX19fX19fn5+f39/gICBgYGCgoODhISEhYWGhoeHh4iIiIiIiIiIiIiIiIiIiIiHh4eHhoaGhYWEhIODgoKBgYCAf39+fn59fX19fXx8fHx8fH19fX5+fn9/f4CAgICAgYGBgYGBgoKCgoKCgoKCgoKCgoKCgoKCgoKBgYGBgYGBgICAgH9/f39/f35+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+',
    duration: 0.6,
  },
  witness: {
    // Footsteps/approach sound
    dataUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgH9/gICBgoOEhoeJio2Pk5WYmp2goqWoq66ws7W4ur2/wcPFx8nKzM3Oz9DQ0dHR0dHR0NDPz87NzMvJyMbEwr+9u7i2s7CuqqelpKCdmZeUkY6LiIWCgH17eXd1c3Jxb29ubm5ub29wcHFyc3R1dnh5e3x9f4GCg4WHiImLjI2Oj5CRkpOTlJSVlZaWlpaWlpaWlZWVlZSUk5OSkZCQj46NjIuKiYiHhoWEg4KBgIB/fn18fHt7e3t6e3t7fHx9fX5+f4CAgYGCg4OEhIWFhoeHiImJiYqKi4uLi4uLi4uLi4uLioqKioqKiomJiYiIh4eGhoWFhIODgoKBgYCAf39+fn19fX19fX19fX1+fn5/f4CAgIGBgoKDg4OEhYWFhoaGh4eHiIiIiIiIiIiIiIiIiIeHh4eHhoaGhYWFhISEg4ODgoKCgYGAgIB/f39/fn5+fn5+fn5+fn5+fn5/f39/f4CAgICAgYGBgYGBgYGBgYGCgoKCgoKCgoKCgoKBgYGBgYGAgICAgIB/f39/f39/f39/f35+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+',
    duration: 1.0,
  },
  verdict: {
    // Triumphant/dramatic chord
    dataUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgH19foGEiI2TmZ+lq7C1ub3Aw8bJy83Q0tTW19jZ2trb29vb29vb29va2tnY19bU09HQzsrIxsO/vLm1sq6qpqKenJmWk5CNioiGhIKAf359e3p6enp6ent8fX5/gIGDhIaHiYqMjY+QkZKTlJWWl5eYmJmZmpqamZqampqamZmZmZiYmJeXlpWVlJOSkZCPjo2Mi4qJiIeGhYSDgoGBgH9/fn59fX19fX19fX1+fn5/f4CAgIGBgoKDg4OEhIWFhoaGh4eIiIiIiImJiYmJiYmJiYmJiYiJiIiIh4eHhoaGhYWFhISDg4ODgoKCgYGBgICAf39/fn5+fn5+fn5+fn5+fn5+f39/f3+AgICAgICAgYGBgYGBgYGBgYGBgoKCgoKCgoKCgoKCgoKBgYGBgYGAgICAgH9/f39/f39/f39/f39+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+',
    duration: 1.2,
  },
  ambiance: {
    // Court room background murmur
    dataUrl: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgH9/f4CAgYGBgoKCgoODg4ODhISEhIWFhYWGhoaGh4eHh4iIiIiIiYmJiYqKioqKi4uLi4uMjIyMjY2NjY2OjY6Ojo6Ojo6Ojo6Ojo6Ojo6NjY2NjY2NjI2MjIyMjIuLi4uLi4qKioqKiomJiYmJiYiIiIiIh4eHh4eGhoaGhoWFhYWFhISEhISDg4ODg4KCgoKCgYGBgYGAgICAgH9/f39/fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+f39/f39/gICAgICAgIGBgYGBgoKCgoKDg4ODg4ODhISEhIWFhYWFhoaGhoaHh4eHiIiIiIiIiYmJiYmJiomKioqKiouLi4uLi4uLjIyMjIyMjIyNjY2NjY2NjY2NjY2NjY2NjY2MjY2MjIyMjIyMi4yLi4uLi4uKioqKioqJiYmJiYmJiIiIiIiHh4eHh4aGhoaGhYWFhYWEhISEhIODg4ODg4KCgoKBgYGBgYCAgICAf39/f39/fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+',
    duration: 3.0,
  },
};

export type SoundType = keyof typeof OFFLINE_SOUNDS;

interface UseOfflineAudioOptions {
  volume?: number;
  preload?: boolean;
}

interface AudioCache {
  [key: string]: HTMLAudioElement;
}

export function useOfflineAudio(options: UseOfflineAudioOptions = {}) {
  const { volume = 0.5, preload = true } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioCache = useRef<AudioCache>({});
  const [currentVolume, setCurrentVolume] = useState(volume);

  // Preload all sounds
  const loadSounds = useCallback(async () => {
    setIsLoading(true);
    
    const loadPromises = Object.entries(OFFLINE_SOUNDS).map(([key, sound]) => {
      return new Promise<void>((resolve) => {
        const audio = new Audio(sound.dataUrl);
        audio.volume = currentVolume;
        audio.preload = 'auto';
        
        audio.oncanplaythrough = () => {
          audioCache.current[key] = audio;
          resolve();
        };
        
        audio.onerror = () => {
          console.warn(`Failed to load sound: ${key}`);
          resolve();
        };
        
        // Force load
        audio.load();
      });
    });

    await Promise.all(loadPromises);
    setIsLoaded(true);
    setIsLoading(false);
  }, [currentVolume]);

  // Auto-preload if enabled
  useEffect(() => {
    if (preload && !isLoaded && !isLoading) {
      loadSounds();
    }
  }, [preload, isLoaded, isLoading, loadSounds]);

  // Play a sound
  const play = useCallback((soundType: SoundType) => {
    const cached = audioCache.current[soundType];
    
    if (cached) {
      // Clone for overlapping sounds
      const clone = cached.cloneNode() as HTMLAudioElement;
      clone.volume = currentVolume;
      clone.play().catch(console.warn);
      return;
    }

    // Fallback to direct play if not cached
    const sound = OFFLINE_SOUNDS[soundType];
    if (sound) {
      const audio = new Audio(sound.dataUrl);
      audio.volume = currentVolume;
      audio.play().catch(console.warn);
    }
  }, [currentVolume]);

  // Play gavel
  const playGavel = useCallback(() => play('gavel'), [play]);
  
  // Play tension
  const playTension = useCallback(() => play('tension'), [play]);
  
  // Play objection
  const playObjection = useCallback(() => play('objection'), [play]);
  
  // Play evidence
  const playEvidence = useCallback(() => play('evidence'), [play]);
  
  // Play witness
  const playWitness = useCallback(() => play('witness'), [play]);
  
  // Play verdict
  const playVerdict = useCallback(() => play('verdict'), [play]);

  // Set volume for all sounds
  const setVolume = useCallback((vol: number) => {
    setCurrentVolume(vol);
    Object.values(audioCache.current).forEach(audio => {
      audio.volume = vol;
    });
  }, []);

  // Download all sounds for offline use (creates a zip-like bundle)
  const downloadForOffline = useCallback(() => {
    const bundle = JSON.stringify({
      version: '1.0',
      sounds: OFFLINE_SOUNDS,
      timestamp: Date.now(),
    });
    
    // Store in localStorage for offline access
    try {
      localStorage.setItem('court-sounds-bundle', bundle);
      return true;
    } catch (e) {
      console.error('Failed to save sounds for offline:', e);
      return false;
    }
  }, []);

  // Check if offline bundle exists
  const hasOfflineBundle = useCallback(() => {
    return !!localStorage.getItem('court-sounds-bundle');
  }, []);

  return {
    isLoaded,
    isLoading,
    play,
    playGavel,
    playTension,
    playObjection,
    playEvidence,
    playWitness,
    playVerdict,
    setVolume,
    loadSounds,
    downloadForOffline,
    hasOfflineBundle,
    volume: currentVolume,
  };
}
