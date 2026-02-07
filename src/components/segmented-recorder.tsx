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
    const [segmentsCount, setSegmentsCount] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Constants
    const SEGMENT_DURATION_MS = 3 * 60 * 1000; // 3 minutes per segment (safe for < 4.5MB)

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (intervalRef.current) clearInterval(intervalRef.current);
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

        setIsRecording(false);
        onComplete();
    }, [onComplete]);

    const startNewSegment = useCallback(() => {
        if (!streamRef.current) return;

        // Stop previous if active
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }

        // Start new recorder instance for clean header
        const recorder = new MediaRecorder(streamRef.current, {
            mimeType: "audio/webm;codecs=opus",
            // bitsPerSecond: 16000 // Voice optimization (optional, some browsers ignore)
        });

        recorder.ondataavailable = async (e) => {
            if (e.data.size > 0) {
                try {
                    // Upload immediately
                    await onAudioSegment(e.data, segmentsCount);
                    setSegmentsCount(prev => prev + 1);
                } catch (err) {
                    console.error("Segment upload failed", err);
                    toast.error("Erro ao enviar segmento de áudio. Verifique sua conexão.");
                }
            }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;

    }, [onAudioSegment, segmentsCount]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setIsRecording(true);
            setDuration(0);
            setSegmentsCount(0);

            // Start first segment
            startNewSegment();

            // Duration Timer
            durationIntervalRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

            // Segment Timer
            intervalRef.current = setInterval(() => {
                console.log("Rotating segment...");
                startNewSegment();
            }, SEGMENT_DURATION_MS);

        } catch (err) {
            console.error("Error starting recording:", err);
            toast.error("Erro ao acessar microfone. Verifique as permissões.");
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Cleanup on unmount
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
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-mono font-bold text-foreground tabular-nums">
                            {formatTime(duration)}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Gravando segmento {segmentsCount + 1}...
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
                        <p className="text-sm text-muted-foreground">O áudio será processado em tempo real.</p>
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
