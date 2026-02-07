"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob) => void;
  onRecordingStart?: () => void;
  disabled?: boolean;
}

export function AudioRecorder({ onAudioReady, onRecordingStart, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getSupportedMimeType = () => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "audio/webm";
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      const mimeType = getSupportedMimeType();

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioReady(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      onRecordingStart?.();

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Erro ao iniciar gravacao:", err);
      setError("Nao foi possivel acessar o microfone. Verifique as permissoes.");
    }
  }, [onAudioReady, onRecordingStart]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("audio/")) {
          setError("Selecione um arquivo de audio valido.");
          return;
        }

        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        onAudioReady(file);
      }
    },
    [onAudioReady]
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const reset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {isRecording ? (
        /* ===== RECORDING STATE ===== */
        <div className="flex flex-col items-center py-8">
          {/* Animated Recording Indicator */}
          <div className="relative mb-8">
            {!isPaused && (
              <>
                <div className="absolute inset-0 w-32 h-32 rounded-full bg-red-500/20 animate-ping" />
                <div className="absolute inset-2 w-28 h-28 rounded-full bg-red-500/30 animate-pulse" />
              </>
            )}
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${isPaused ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/30' : 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30'}`}>
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-white tabular-nums">
                  {formatDuration(duration)}
                </div>
              </div>
            </div>
            {/* Status badge */}
            <div className={`absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full shadow-lg text-xs font-semibold ${isPaused ? 'bg-amber-100 text-amber-700' : 'bg-white text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
              {isPaused ? 'PAUSADO' : 'GRAVANDO'}
            </div>
          </div>

          {/* Waveform visualization */}
          <div className="flex items-center justify-center gap-1 h-12 mb-6">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${isPaused ? 'bg-amber-400/60 h-2' : 'bg-red-500/60'}`}
                style={!isPaused ? {
                  height: `${Math.sin((Date.now() / 200) + i * 0.5) * 16 + 20}px`,
                } : undefined}
              />
            ))}
          </div>

          {/* Info card */}
          <div className="w-full max-w-sm mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isPaused ? 'Gravacao pausada' : 'Capturando consulta'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isPaused
                    ? 'Clique em continuar para retomar a gravacao.'
                    : 'Posicione o dispositivo proximo aos participantes.'}
                </p>
              </div>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-3">
            {isPaused ? (
              <Button onClick={resumeRecording} variant="outline" size="lg" className="gap-2 rounded-xl">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Continuar
              </Button>
            ) : (
              <Button onClick={pauseRecording} variant="outline" size="lg" className="gap-2 rounded-xl">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pausar
              </Button>
            )}
            <Button onClick={stopRecording} size="lg" className="gap-2 rounded-xl bg-red-600 hover:bg-red-700" disabled={disabled}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Finalizar
            </Button>
          </div>

          {/* Privacy indicator */}
          <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Audio armazenado com seguranca
          </div>
        </div>
      ) : audioUrl ? (
        /* ===== PLAYBACK STATE ===== */
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <p className="text-xl font-semibold text-foreground mb-1">Gravacao concluida</p>
          <p className="text-sm text-muted-foreground mb-6">Duracao: {formatDuration(duration)}</p>

          <audio src={audioUrl} controls className="w-full max-w-md mb-6 rounded-xl" />

          <Button onClick={reset} variant="outline" size="lg" className="rounded-xl gap-2" disabled={disabled}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Gravar novamente
          </Button>
        </div>
      ) : (
        /* ===== INITIAL STATE ===== */
        <div className="flex flex-col items-center py-8">
          {/* Main Record Button */}
          <button
            onClick={startRecording}
            disabled={disabled}
            className="group relative w-44 h-44 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-8"
          >
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 group-hover:from-primary/15 group-hover:to-primary/25 transition-colors" />
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:scale-105 transition-transform">
              <svg className="w-14 h-14 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
          </button>

          <p className="text-xl font-semibold text-foreground mb-2">Iniciar gravacao</p>
          <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs">
            Pressione para capturar o audio da consulta. Voce pode pausar a qualquer momento.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full max-w-xs mb-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Upload Option */}
          <div className="relative">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={disabled}
            />
            <Button variant="outline" size="lg" className="rounded-xl gap-2 px-6" disabled={disabled}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Importar arquivo
            </Button>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Microfone disponivel
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Criptografado
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
