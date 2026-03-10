// src/components/useSoundEngine.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import { MetronomeSoundEngine, PreviewHandle } from './MetronomeSoundEngine';
import { SoundSettings, PreviewOptions, AudioError, Result } from './soundTypes';

export const useSoundEngine = () => {
  const engineRef = useRef<MetronomeSoundEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AudioError | null>(null);
  const [currentSettings, setCurrentSettings] = useState<SoundSettings | null>(null);

  const initialize = useCallback(async (): Promise<Result<void>> => {
    if (engineRef.current && isInitialized) {
      return { success: true, data: undefined };
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!engineRef.current) {
        engineRef.current = MetronomeSoundEngine.getInstance();
      }

      const result = await engineRef.current.initialize();
      
      setIsLoading(false);
      
      if (result.success) {
        setIsInitialized(true);
        setError(null);
      } else {
        // Handle only explicit failure cases
        const failedResult = result as { success: false; error: AudioError };
        setError(failedResult.error);
      }
      
      return result;
    } catch (err) {
      setIsLoading(false);
      const errorResult: Result<void> = {
        success: false,
        error: AudioError.ContextCreationFailed
      };
      setError(AudioError.ContextCreationFailed);
      return errorResult;
    }
  }, [isInitialized]);

  const applySettings = useCallback((settings: SoundSettings): Result<void> => {
    if (!engineRef.current || !isInitialized) {
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }

    const result = engineRef.current.applySettings(settings);
    if (result.success) {
      setCurrentSettings(settings);
    }
    
    return result;
  }, [isInitialized]);

  const playBeat = useCallback((
    type: 'strong' | 'weak' | 'accent', 
    when?: number
  ): Result<void> => {
    if (!engineRef.current || !isInitialized) {
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }

    return engineRef.current.playBeat(type, when);
  }, [isInitialized]);

  const preview = useCallback(async (
    options: PreviewOptions
  ): Promise<Result<PreviewHandle>> => {
    if (!engineRef.current || !isInitialized) {
      return {
        success: false,
        error: AudioError.ContextCreationFailed
      };
    }

    return engineRef.current.preview(options);
  }, [isInitialized]);

  const stopAll = useCallback((): Result<void> => {
    if (!engineRef.current) {
      return { success: true, data: undefined };
    }

    return engineRef.current.stopAll();
  }, []);

  const isPlaying = useCallback((): boolean => {
    if (!engineRef.current) return false;
    return engineRef.current.isPlaying();
  }, []);

  useEffect(() => {
    return () => {
      // MetronomeSoundEngine is a shared singleton used by the main metronome engine.
      // Do not dispose it when the settings panel unmounts.
    };
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    currentSettings,
    initialize,
    applySettings,
    playBeat,
    preview,
    stopAll,
    isPlaying
  };
};
