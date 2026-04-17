"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useKeepAlive } from "@/lib/use-keep-alive";

interface ContinueRecordingProps {
  visitId: string;
  onTranscriptAppended: (newText: string, wordCount: number) => void;
  onRegenerate: () => void;
  onClose: () => void;
}

export function ContinueRecording({
  visitId,
  onTranscriptAppended,
  onRegenerate,
  onClose,
}: ContinueRecordingProps) {
  const [phase, setPhase] = useState<"idle" | "recording" | "done">("idle");
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploadingChunks, setUploadingChunks] = useState(0);
  const [totalNewWords, setTotalNewWords] = useState(0);
  const [currentPulse, setCurrentPulse] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkIndexRef = useRef(0);
  const { enableKeepAlive, disableKeepAlive } = useKeepAlive();

  const SEGMENT_MS = 3 * 60 * 1000;

  const getSupportedMimeType = () => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const uploadChunk = useCallback(async (blob: Blob, index: number): Promise<string | undefined> => {
    try {
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      const formData = new FormData();
      formData.append("audio", blob, `continue_chunk_${index}.${ext}`);
      formData.append("visitId", visitId);
      formData.append("chunkIndex", (1000 + index).toString()); // offset to avoid collisions

      const res = await fetch("/api/transcribe-chunk", { method: "POST", body: formData });
      if (!res.ok) return undefined;

      const data = await res.json();
      setUploadingChunks(prev => prev + 1);
      if (data.text) {
        const words = data.text.trim().split(/\s+/).filter(Boolean).length;
        setTotalNewWords(prev => prev + words);
        onTranscriptAppended(data.text, words);
      }
      return data.pulse;
    } catch {
      return undefined;
    }
  }, [visitId, onTranscriptAppended]);

  const stopAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const stopRecording = useCallback(async () => {
    stopAllTimers();
    disableKeepAlive();
    
    // Explicitly request remaining data before stopping
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.requestData();
      // Allow slight delay to let data event propagate before stop
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      }, 500);
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setPhase("done");
    setIsPaused(false);
  }, [disableKeepAlive]);

  // We don't rotate MediaRecorders anymore. We create it once and requestData on interval.
  const setupMediaRecorder = useCallback(() => {
    if (!streamRef.current) return;
    const mimeType = getSupportedMimeType();
    if (!mimeType) { toast.error("Formato de áudio não suportado."); return; }

    try {
      const audioOnlyStream = new MediaStream(streamRef.current.getAudioTracks());
      // Timeslice will trigger ondataavailable periodically
      const recorder = new MediaRecorder(audioOnlyStream, { mimeType });

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          const idx = chunkIndexRef.current++;
          const pulse = await uploadChunk(e.data, idx);
          if (pulse) setCurrentPulse(pulse);
        }
      };

      recorder.start(SEGMENT_MS); // Emit data every SEGMENT_MS
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error("Failed to create MediaRecorder", err);
      toast.error("Erro ao iniciar gravador.");
      stopRecording();
    }
  }, [uploadChunk, SEGMENT_MS, stopRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      // Force dump of data before pausing
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.pause();
      stopAllTimers();
      disableKeepAlive();
      setIsPaused(true);
    }
  }, [disableKeepAlive]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      enableKeepAlive();
      timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
      setIsPaused(false);
    }
  }, [enableKeepAlive]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      chunkIndexRef.current = 0;
      setDuration(0);
      setTotalNewWords(0);
      setUploadingChunks(0);
      setCurrentPulse(null);
      setPhase("recording");

      enableKeepAlive();
      setupMediaRecorder();
      timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
    } catch {
      toast.error("Erro ao acessar microfone. Verifique permissões.");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllTimers();
      disableKeepAlive();
      if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
      onClose();
    }
  };

  // ─── IDLE ────────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Continuar gravação</p>
            <p className="text-xs text-muted-foreground">O novo áudio será adicionado à transcrição existente</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <Button
          size="sm"
          className="w-full gap-2 rounded-lg"
          onClick={startRecording}
        >
          <span className="w-2 h-2 rounded-full bg-white/80" />
          Iniciar nova sessão de gravação
        </Button>
      </div>
    );
  }

  // ─── RECORDING ───────────────────────────────────────────────────────────────
  if (phase === "recording") {
    return (
      <div className="border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50 rounded-xl p-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          {/* Animated mic indicator */}
          <div className="relative flex-shrink-0 w-9 h-9">
            {!isPaused && (
              <span className="absolute inset-0 rounded-full bg-red-400/40 animate-ping" />
            )}
            <div className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300 ${isPaused ? "bg-muted" : "bg-red-500"}`}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isPaused ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                )}
              </svg>
            </div>
          </div>

          {/* Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground tabular-nums">{formatTime(duration)}</span>
              <span className={`text-xs font-medium ${isPaused ? "text-muted-foreground" : "text-red-600 dark:text-red-400"}`}>
                {isPaused ? "Pausado" : "Gravando sessão adicional"}
              </span>
            </div>
            {currentPulse && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                {currentPulse}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              title={isPaused ? "Retomar" : "Pausar"}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isPaused ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                )}
              </svg>
            </button>
            <button
              onClick={stopRecording}
              title="Encerrar sessão"
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── DONE ────────────────────────────────────────────────────────────────────
  return (
    <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Sessão encerrada
            {totalNewWords > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/15 text-primary">
                +{totalNewWords} palavras
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            O que deseja fazer com a transcrição atualizada?
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          size="sm"
          className="flex-1 gap-2 text-xs"
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Gerando...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Re-gerar SOAP com IA
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={onClose}
          disabled={isRegenerating}
        >
          Só salvar transcrição
        </Button>
      </div>
    </div>
  );
}
