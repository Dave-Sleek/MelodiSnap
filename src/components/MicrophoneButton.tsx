import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface MicrophoneButtonProps {
  onRecognitionStarted: () => void;
  onRecognitionFinished: (audioBlob: Blob) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const MicrophoneButton = ({ 
  onRecognitionStarted, 
  onRecognitionFinished, 
  onCancel,
  isProcessing 
}: MicrophoneButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [timer, setTimer] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0); // 0 to 1
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const { showToast } = useToast();

  const cleanupAudioNodes = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVolumeLevel(0);
  };

  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as any }).then((result) => {
        setPermissionStatus(result.state as any);
        result.onchange = () => {
          setPermissionStatus(result.state as any);
        };
      }).catch(() => {
        // Fallback for browsers that don't support mic permission query
      });
    }
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Microphone access is not supported in this browser.', 'error');
      return;
    }

    try {
      // Request mono audio at 44.1kHz for optimal fingerprinting (common AudD recommendation)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      setPermissionStatus('granted');
      
      // Set up real-time audio volume analysis
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVolumeLevel(Math.min(1, avg / 128));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (e) {
        console.warn('Analyser setup fallback', e);
      }

      // Explicitly check for supported mime types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') 
          ? 'audio/ogg;codecs=opus' 
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000 // Higher bitrate for better fingerprinting
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Only trigger recognition if we actually have data and met minimum time
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
          
          // AudD needs at least a few seconds for a reliable fingerprint
          if (audioBlob.size < 4000) { // Extremely small file check
            showToast('Recording too short or silent. Please try again.', 'info');
            onCancel();
          } else {
            onRecognitionFinished(audioBlob);
          }
        } else {
          showToast('No audio data captured. Please try again.', 'error');
          onCancel();
        }
        
        stream.getTracks().forEach((track) => track.stop());
        cleanupAudioNodes();
      };

      // Start recording with a timeslice to ensure dataavailable fires regularly
      mediaRecorder.start(1000); 
      setIsListening(true);
      setTimer(0);
      onRecognitionStarted();

      timerIntervalRef.current = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic access denied:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        showToast('Microphone access denied. Please enable it in your browser settings.', 'error');
      } else {
        showToast('Could not access microphone. Please ensure no other app is using it.', 'error');
      }
      cleanupAudioNodes();
    }
  };

  useEffect(() => {
    if (timer >= 12 && isListening) {
      stopRecording();
    }
  }, [timer, isListening]);

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    // Minimum recording duration of 4 seconds for AudD accuracy (increased from 3s)
    if (timer < 4) {
      showToast('Please record for at least 4 seconds for better accuracy.', 'info');
      return;
    }

    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsListening(false);
  };

  const handleCancel = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    cleanupAudioNodes();
    setIsListening(false);
    onCancel();
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      cleanupAudioNodes();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-10">
      <div className="relative flex items-center justify-center">
        {/* Animated Sonic Ambient Rings - Monochromatic Blue Theme */}
        <AnimatePresence>
          {isListening && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ 
                    scale: [1, 2.2 + volumeLevel * 0.8], 
                    opacity: [0.6, 0] 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 2.2, 
                    repeat: Infinity, 
                    ease: 'easeOut',
                    delay: i * 0.7 
                  }}
                  className="absolute inset-0 bg-[var(--accent-primary)]/10 rounded-full pointer-events-none"
                />
              ))}
              {/* Dynamic waveform ring reflecting real audio volume */}
              <motion.div
                animate={{ 
                  scale: 1 + volumeLevel * 0.25,
                  opacity: 0.4 + volumeLevel * 0.4,
                }}
                transition={{ duration: 0.1 }}
                className="absolute -inset-4 bg-[var(--accent-primary)]/10 rounded-full blur-xl pointer-events-none"
              />
            </>
          )}
        </AnimatePresence>

        {/* Central Listening Trigger */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={isListening ? stopRecording : startRecording}
          disabled={isProcessing}
          aria-label={isListening ? 'Stop listening' : isProcessing ? 'Identifying track' : 'Start listening'}
          className={`relative z-10 w-48 h-48 sm:w-60 sm:h-60 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl border ${
            isListening 
              ? 'bg-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.3)] border-white/40 text-white' 
              : isProcessing 
                ? 'glass-card border-[var(--glass-border)] cursor-not-allowed text-[var(--text-muted)]' 
                : 'bg-[var(--accent-primary)] shadow-[0_0_55px_rgba(0,122,255,0.25)] hover:shadow-[0_0_75px_rgba(0,122,255,0.4)] border-white/20 text-white'
          }`}
        >
          {/* Subtle Inner Ring */}
          <div className="absolute inset-2 sm:inset-3 rounded-full border border-white/10 pointer-events-none" />

          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-2"
              >
                <Loader2 className="w-14 h-14 sm:w-16 sm:h-16 text-white animate-spin" />
              </motion.div>
            ) : isListening ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-2"
              >
                <Square className="w-12 h-12 sm:w-14 sm:h-14 fill-current text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-2"
              >
                <Mic className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Status Typography */}
      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
          {permissionStatus === 'denied' 
            ? 'Access Blocked' 
            : isListening 
              ? `Listening... (${timer}s)` 
              : isProcessing 
                ? 'Matching Audio Footprint' 
                : 'Tap to Identify'}
        </h2>
        
        <div className="text-sm text-[var(--text-muted)] leading-relaxed font-normal">
          {permissionStatus === 'denied' ? (
            <div className="space-y-4">
              <p>melodisnap needs your microphone to hear and identify music. Access was denied.</p>
              <div className="glass-card rounded-xl p-4 text-xs space-y-2 text-left bg-red-500/5 border-red-500/20">
                <p className="font-bold text-red-400">How to fix:</p>
                <ol className="list-decimal list-inside space-y-1.5 opacity-80">
                  <li>Click the <span className="font-bold">lock icon</span> 🔒 in your browser address bar.</li>
                  <li>Enable <span className="font-bold">Microphone</span> access.</li>
                  <li>Refresh this page and try again.</li>
                </ol>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary-glass px-5 py-2 rounded-xl text-xs font-bold mt-2"
              >
                Refresh Page
              </button>
            </div>
          ) : (
            <p>
              {isListening 
                ? 'Hold your device close to the audio source for the best match.' 
                : isProcessing 
                  ? 'Searching through acoustic fingerprints...' 
                  : 'Identify any song playing on the radio, TV, or around you.'}
            </p>
          )}
        </div>

        {/* Live Audio Visualizer Bars when listening - Single Blue Palette */}
        {isListening && (
          <div className="flex items-center justify-center gap-1.5 pt-3 h-8">
            {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50].map((h, i) => (
              <motion.span
                key={i}
                animate={{ 
                  height: Math.max(4, h * (0.3 + volumeLevel * 0.7)),
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-1 bg-[var(--accent-primary)] rounded-full shadow-[0_0_8px_rgba(0,122,255,0.4)]"
              />
            ))}
          </div>
        )}
      </div>

      {isListening && (
        <button
          onClick={handleCancel}
          className="btn-secondary-glass px-6 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all shadow-sm active:scale-95"
        >
          Cancel
        </button>
      )}
    </div>
  );
};
