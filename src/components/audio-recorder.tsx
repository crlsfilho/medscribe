"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onAudioReady, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioReady(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Erro ao iniciar gravacao:", err);
      setError(
        "Nao foi possivel acessar o microfone. Verifique as permissoes do navegador."
      );
    }
  }, [onAudioReady]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

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
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {isRecording ? (
        /* Recording State */
        <div className="flex flex-col items-center py-6">
          {/* Recording Indicator */}
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full bg-destructive/10 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center recording-pulse">
                <div className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Recording badge */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive text-white text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              GRAVANDO
            </div>
          </div>

          {/* Timer */}
          <p className="text-3xl font-mono font-medium text-foreground mb-4">
            {formatDuration(duration)}
          </p>

          {/* Secure microphone indicator */}
          <div className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-[oklch(0.95_0.02_160)] text-[oklch(0.35_0.12_160)] text-xs font-medium">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
            Capturando audio
          </div>

          {/* Info message */}
          <div className="w-full max-w-md mb-6 p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
              <div>
                <p className="text-sm text-foreground font-medium mb-1">
                  Gravacao em andamento
                </p>
                <p className="text-xs text-muted-foreground">
                  O audio sera transcrito automaticamente apos finalizar a
                  gravacao. Posicione o dispositivo proximo aos participantes
                  para melhor qualidade.
                </p>
              </div>
            </div>
          </div>

          {/* Stop Button */}
          <Button
            onClick={stopRecording}
            size="lg"
            variant="destructive"
            className="tap-target rounded-xl px-8"
            disabled={disabled}
          >
            Finalizar Gravacao
          </Button>

          {/* Privacy indicator */}
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            Dados armazenados com seguranca
          </div>
        </div>
      ) : audioUrl ? (
        /* Playback State */
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>

          <p className="text-lg font-medium text-foreground mb-1">
            Gravacao concluida
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Duracao: {formatDuration(duration)}
          </p>

          <audio
            src={audioUrl}
            controls
            className="w-full max-w-md mb-6 rounded-xl"
          />

          <Button
            onClick={reset}
            variant="outline"
            className="rounded-xl"
            disabled={disabled}
          >
            Descartar e gravar novamente
          </Button>
        </div>
      ) : (
        /* Initial State - Large Record Button */
        <div className="flex flex-col items-center py-8">
          {/* Main Record Button */}
          <button
            onClick={startRecording}
            disabled={disabled}
            className="group relative w-40 h-40 rounded-full bg-primary/10 hover:bg-primary/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-8"
          >
            <div className="absolute inset-4 rounded-full bg-primary/20 group-hover:bg-primary/25 transition-colors"></div>
            <div className="absolute inset-8 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <svg
                className="w-12 h-12 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            </div>
          </button>

          <p className="text-lg font-medium text-foreground mb-2">
            Iniciar gravacao
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Pressione para capturar o audio da consulta
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full max-w-xs mb-8">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              ou
            </span>
            <div className="flex-1 h-px bg-border"></div>
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
            <Button
              variant="outline"
              size="lg"
              className="tap-target rounded-xl gap-2"
              disabled={disabled}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              Importar arquivo de audio
            </Button>
          </div>

          {/* Mic status */}
          <div className="flex items-center gap-2 mt-8 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[oklch(0.55_0.15_160)]"></span>
            Microfone disponivel
          </div>
        </div>
      )}
    </div>
  );
}
