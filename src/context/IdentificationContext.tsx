import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { addToHistory, toggleFavourite } from '../lib/db';
import { SongResult } from '../components/SongCard';

export interface IdentificationContextType {
  isListening: boolean;
  isProcessing: boolean;
  identifiedSong: SongResult | null;
  error: string | null;
  noMatch: boolean;
  timer: number;
  volumeLevel: number;
  permissionStatus: 'prompt' | 'granted' | 'denied';
  startIdentification: () => Promise<void>;
  stopIdentification: () => void;
  cancelIdentification: () => void;
  resetIdentification: () => void;
  toggleFavouriteIdentified: () => Promise<void>;
}

const IdentificationContext = createContext<IdentificationContextType | undefined>(undefined);

export const IdentificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [identifiedSong, setIdentifiedSong] = useState<SongResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [timer, setTimer] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const { showToast } = useToast();

  const cleanupAudioNodes = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVolumeLevel(0);
  }, []);

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as any }).then((result) => {
        setPermissionStatus(result.state as any);
        result.onchange = () => {
          setPermissionStatus(result.state as any);
        };
      }).catch(() => {});
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      cleanupAudioNodes();
    };
  }, [cleanupAudioNodes]);

  const resetIdentification = useCallback(() => {
    setError(null);
    setNoMatch(false);
    setIdentifiedSong(null);
    setTimer(0);
    setIsProcessing(false);
    setIsListening(false);
    cleanupAudioNodes();
  }, [cleanupAudioNodes]);

  const handleRecognitionFinished = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    setNoMatch(false);

    try {
      const ext = audioBlob.type.includes('webm') ? 'webm' :
                  audioBlob.type.includes('ogg') ? 'ogg' :
                  audioBlob.type.includes('mp4') ? 'mp4' : 'wav';

      const formData = new FormData();
      formData.append('audio', audioBlob, `recording.${ext}`);

      const response = await fetch('/api/recognize', {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Recognition service returned an invalid response.');
      }

      if (!response.ok || data.status === 'error') {
        throw new Error(data.error || data.detail || 'The recognition service returned an error.');
      }

      if (data.status === 'success' && data.result) {
        const songData: SongResult = {
          title: data.result.title,
          artist: data.result.artist,
          album: data.result.album || '',
          artwork: data.result.spotify?.album?.images?.[0]?.url || data.result.apple_music?.artwork?.url || '',
          spotifyId: data.result.spotify?.id,
          appleMusicId: data.result.apple_music?.id,
          previewUrl: data.result.spotify?.preview_url || data.result.apple_music?.previews?.[0]?.url || `synth:${(data.result.genre || 'pop').toLowerCase()}:${data.result.title}`,
        };

        const historyRecord = {
          title: songData.title,
          artist: songData.artist,
          album: songData.album || '',
          artwork: songData.artwork || '',
          spotifyId: songData.spotifyId,
          appleMusicId: songData.appleMusicId,
          previewUrl: songData.previewUrl,
        };

        const id = await addToHistory(historyRecord);
        setIdentifiedSong({ ...songData, id });
      } else if (data.result === null) {
        setNoMatch(true);
      } else {
        setError(data.error || 'The recognition service could not identify this track.');
      }
    } catch (err: any) {
      console.error('Recognition Error:', err);
      setError(err.message || 'A network error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const stopRecordingInternal = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    if (mediaRecorderRef.current.state === 'recording') {
      try {
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
      } catch (e) {
        console.warn('requestData error:', e);
      }
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startIdentification = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Microphone access is not supported in this browser.', 'error');
      return;
    }

    resetIdentification();

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true,
          } 
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      setPermissionStatus('granted');
      
      let recorderStream = stream;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 80;

        const presence = ctx.createBiquadFilter();
        presence.type = 'peaking';
        presence.frequency.value = 2500;
        presence.gain.value = 4.5;

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -38;
        compressor.knee.value = 20;
        compressor.ratio.value = 8;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 2.8;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;

        const destination = ctx.createMediaStreamDestination();

        source.connect(highpass);
        highpass.connect(presence);
        presence.connect(compressor);
        compressor.connect(gainNode);
        gainNode.connect(analyser);
        gainNode.connect(destination);

        recorderStream = destination.stream;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setVolumeLevel(Math.min(1, avg / 128));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (e) {
        recorderStream = stream;
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') 
          ? 'audio/ogg;codecs=opus' 
          : 'audio/webm';

      const mediaRecorder = new MediaRecorder(recorderStream, { mimeType, audioBitsPerSecond: 128000 });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
          if (audioBlob.size < 4000) {
            showToast('Recording too short. Please try again.', 'info');
            resetIdentification();
          } else {
            handleRecognitionFinished(audioBlob);
          }
        }
        
        // Ensure tracks are stopped and released immediately
        if (stream) {
          stream.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
        }
        cleanupAudioNodes();
      };

      mediaRecorder.start(500); 
      setIsListening(true);
      timerIntervalRef.current = window.setInterval(() => {
        setTimer((prev) => {
          if (prev >= 9) {
            stopRecordingInternal();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        showToast('Microphone access denied.', 'error');
      }
      cleanupAudioNodes();
      setIsListening(false);
    }
  }, [cleanupAudioNodes, handleRecognitionFinished, resetIdentification, showToast, stopRecordingInternal]);

  const stopIdentification = useCallback(() => {
    if (timer < 5) {
      showToast('Please wait at least 5 seconds...', 'info');
      return;
    }
    stopRecordingInternal();
  }, [timer, showToast, stopRecordingInternal]);

  const cancelIdentification = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    resetIdentification();
  }, [resetIdentification]);

  const toggleFavouriteIdentified = useCallback(async () => {
    if (identifiedSong) {
      const isFav = await toggleFavourite(identifiedSong);
      setIdentifiedSong(prev => prev ? { ...prev, isFavourite: isFav } : null);
    }
  }, [identifiedSong]);

  return (
    <IdentificationContext.Provider
      value={{
        isListening,
        isProcessing,
        identifiedSong,
        error,
        noMatch,
        timer,
        volumeLevel,
        permissionStatus,
        startIdentification,
        stopIdentification,
        cancelIdentification,
        resetIdentification,
        toggleFavouriteIdentified,
      }}
    >
      {children}
    </IdentificationContext.Provider>
  );
};

export const useIdentification = () => {
  const context = useContext(IdentificationContext);
  if (!context) throw new Error('useIdentification must be used within an IdentificationProvider');
  return context;
};
