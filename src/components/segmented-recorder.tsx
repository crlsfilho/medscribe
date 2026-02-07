"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SegmentedAudioRecorderProps {
    onAudioSegment: (blob: Blob, index: number) => Promise<void>;
    onComplete: () => void;
    disabled?: boolean;
}

export function SegmentedAudioRecorder({ onAudioSegment, onComplete, disabled }: SegmentedAudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [chunkIndex, setChunkIndex] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const chunkIndexRef = useRef(0); // Ref to avoid closure staleness in timers

    // Duration of each segment (3 minutes)
    const SEGMENT_MS = 3 * 60 * 1000;

    const getSupportedMimeType = () => {
        const types = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/mp4",
            "audio/ogg",
            "audio/wav"
        ];
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) return type;
        }
        return "";
    };

    const stopRecording = useCallback(async () => {
        console.log("Stopping recording...");

        // Clear timers
        if (timerRef.current) clearInterval(timerRef.current);
        if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current);

        // Stop current recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            // processing of the final chunk happens in ondataavailable
        }

        // Stop stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setIsRecording(false);
        // We do NOT call onComplete here immediately because the last chunk might still be uploading.
        // We wait a tick or let the user click "Finish" which called this.
        onComplete();
    }, [onComplete]);

    const startNewSegment = useCallback(() => {
        if (!streamRef.current) return;

        const mimeType = getSupportedMimeType();
        if (!mimeType) {
            toast.error("Nenhum formato de áudio suportado pelo navegador.");
            return;
        }

        console.log(`Starting segment ${chunkIndexRef.current} with mime: ${mimeType}`);

        // Stop previous if active
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            // This will trigger 'dataavailable' for the ending segment
            mediaRecorderRef.current.stop();
        }

        try {
            const recorder = new MediaRecorder(streamRef.current, { mimeType });

            // Current segment index for this recorder instance
            const currentSegmentIdx = chunkIndexRef.current;

            recorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    console.log(`Segment ${currentSegmentIdx} data available: ${e.data.size} bytes`);
                    await onAudioSegment(e.data, currentSegmentIdx);
                }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;

            // Advance index for the NEXT segment
            chunkIndexRef.current += 1;
            setChunkIndex(chunkIndexRef.current);

            // Schedule next rotation
            rotationTimerRef.current = setTimeout(() => {
                startNewSegment();
            }, SEGMENT_MS);

        } catch (err) {
            console.error("Failed to create MediaRecorder", err);
            toast.error("Erro ao iniciar gravador.");
            stopRecording();
        }
    }, [onAudioSegment, SEGMENT_MS, stopRecording]); // Added stopRecording to dependencies

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;
            setIsRecording(true);
            setDuration(0);

            chunkIndexRef.current = 0;
            setChunkIndex(0);

            // Start first segment
            startNewSegment();

            // UI Duration Timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast.error("Erro ao acessar microfone. Verifique permissões.");
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        return () => {
            if (isRecording) stopRecording();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-xl bg-card">
            {isRecording ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <span className="absolute w-full h-full rounded-full bg-red-100 animate-ping opacity-75"></span>
                        <div className="relative w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xs">{chunkIndex}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-mono font-bold text-foreground tabular-nums">
                            {formatTime(duration)}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Gravando... (Segmento atual: {chunkIndex + 1})
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        size="lg"
                        className="w-full min-w-[200px] rounded-full mt-2"
                        onClick={stopRecording}
                    >
                        Parar e Finalizar
                    </Button>
                </div>
            ) : (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Toque para gravar</h3>
                        <p className="text-sm text-muted-foreground">Gravação contínua e segura</p>
                    </div>
                    <Button
                        size="lg"
                        className="w-full min-w-[200px] rounded-full"
                        onClick={startRecording}
                        disabled={disabled}
                    >
                        Iniciar Gravação
                    </Button>
                </div>
            )}
        </div>
    );
}
