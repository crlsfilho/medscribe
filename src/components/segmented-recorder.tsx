"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useKeepAlive } from "@/lib/use-keep-alive";

interface SegmentedAudioRecorderProps {
    onAudioSegment: (blob: Blob, index: number) => Promise<string | undefined>;
    onComplete: (finalAudioBlob?: Blob) => void;
    disabled?: boolean;
    recordingMode?: "presencial" | "telemedicina";
}

export function SegmentedAudioRecorder({ onAudioSegment, onComplete, disabled, recordingMode = "presencial" }: SegmentedAudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [chunkIndex, setChunkIndex] = useState(0);
    const [currentPulse, setCurrentPulse] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chunkIndexRef = useRef(0);
    const allChunksRef = useRef<Blob[]>([]);
    const { enableKeepAlive, disableKeepAlive } = useKeepAlive();

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
        disableKeepAlive();

        // Stop current recorder. The 'dataavailable' will fire one last time.
        // We handle compiling the blob in mediaRecorder.onstop
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.requestData();
            setTimeout(() => {
               if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                   mediaRecorderRef.current.stop();
               }
            }, 500);
        } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
        setIsPaused(false);
    }, [disableKeepAlive]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.requestData();
            mediaRecorderRef.current.pause();
            if (timerRef.current) clearInterval(timerRef.current);
            disableKeepAlive();
            setIsPaused(true);
        }
    }, [disableKeepAlive]);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume();
            enableKeepAlive();
            // Resume timers
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

            setIsPaused(false);
        }
    }, [enableKeepAlive]);

    const setupMediaRecorder = useCallback(() => {
        if (!streamRef.current) return;

        const mimeType = getSupportedMimeType();
        if (!mimeType) {
            toast.error("Nenhum formato de áudio suportado pelo navegador.");
            return;
        }

        try {
            // Create a dedicated audio-only stream to avoid MIME type clash with video tracks
            const audioOnlyStream = new MediaStream(streamRef.current.getAudioTracks());
            const recorder = new MediaRecorder(audioOnlyStream, { mimeType });

            recorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    allChunksRef.current.push(e.data);
                    const currentSegmentIdx = chunkIndexRef.current++;
                    
                    console.log(`Segment ${currentSegmentIdx} data available: ${e.data.size} bytes`);
                    const pulse = await onAudioSegment(e.data, currentSegmentIdx);
                    if (pulse) {
                        setCurrentPulse(pulse);
                    }
                    setChunkIndex(currentSegmentIdx + 1);
                }
            };
            
            recorder.onstop = () => {
                const finalBlob = new Blob(allChunksRef.current, { type: mimeType });
                
                // Stop stream
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                
                onComplete(finalBlob);
            };

            recorder.start(SEGMENT_MS);
            mediaRecorderRef.current = recorder;

        } catch (err) {
            console.error("Failed to create MediaRecorder", err);
            toast.error("Erro ao iniciar gravador.");
            stopRecording();
        }
    }, [onAudioSegment, SEGMENT_MS, stopRecording, onComplete]);

    const startRecording = async () => {
        try {
            // Setup Microphone
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            let finalStream = micStream;

            // Setup Browser Audio (Telemedicine mix)
            if (recordingMode === "telemedicina") {
                try {
                    // Try to get screen capture (focusing on audio)
                    const displayStream = await navigator.mediaDevices.getDisplayMedia({
                        video: true, // required by some browsers to capture display audio
                        audio: true
                    });

                    // Check if the user really shared audio
                    const audioTracks = displayStream.getAudioTracks();
                    
                    if (audioTracks.length > 0) {
                        try {
                            // Web Audio API magic to mix both streams
                            const audioContext = new window.AudioContext();
                            const dest = audioContext.createMediaStreamDestination();

                            // Create sources
                            const micSource = audioContext.createMediaStreamSource(micStream);
                            const displaySource = audioContext.createMediaStreamSource(displayStream);

                            // Connect sources to destination mixed stream
                            micSource.connect(dest);
                            displaySource.connect(dest);

                            // Extract video track from display stream (only used for keeping the capture alive, not for recording)
                            const videoTrack = displayStream.getVideoTracks()[0];
                            
                            // Create the final mixed stream: Audio from destination
                            const mixedAudioTracks = dest.stream.getAudioTracks();
                            
                            finalStream = new MediaStream([
                                ...mixedAudioTracks,
                                ...(videoTrack ? [videoTrack] : [])
                            ]);

                            // Handle when the user manually clicks "Stop sharing" on the browser banner
                            if (videoTrack) {
                                videoTrack.onended = () => {
                                    toast.warning("Compartilhamento de tela interrompido. A gravação parou.");
                                    stopRecording();
                                };
                            }
                        } catch (mixErr) {
                            console.error("Error mixing audio streams:", mixErr);
                            toast.error("Erro interno ao misturar áudio. Gravando apenas microfone.");
                            // Fallback to just microphone if mixing fails
                            finalStream = micStream;
                        }
                    } else {
                        // User shared screen but didn't check the "Share Audio" box
                        toast.error("Você não selecionou 'Compartilhar Áudio'. Voltando para gravação apenas de microfone.");
                        displayStream.getTracks().forEach(track => track.stop());
                    }
                } catch (dispErr: any) {
                    console.error("Error capturing display media:", dispErr);
                    // If user cancels the prompt, we should abort the whole recording so they can try again.
                    if (dispErr.name === "NotAllowedError" || dispErr.message.includes("cancel")) {
                        toast.error("Compartilhamento de tela cancelado. Gravação abortada.");
                        micStream.getTracks().forEach(track => track.stop());
                        return; // Abort
                    } else {
                        toast.error("Não foi possível capturar o áudio da guia. Gravando apenas microfone.");
                    }
                }
            }

            streamRef.current = finalStream;
            setIsRecording(true);
            setIsPaused(false);
            setDuration(0);

            chunkIndexRef.current = 0;
            allChunksRef.current = [];
            setChunkIndex(0);

            // Setup and start recorder
            enableKeepAlive();
            setupMediaRecorder();

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
    
    // Auto-start recording if Telemedicina was selected
    useEffect(() => {
        if (recordingMode === "telemedicina" && !isRecording && !isPaused && duration === 0) {
            // Slight delay to allow the UI to render the new step before jarring the user with permissions
            const timeout = setTimeout(() => {
                startRecording();
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [recordingMode]); // Only run when component mounts with telemedicina

    useEffect(() => {
        return () => {
            disableKeepAlive();
            if (isRecording) stopRecording();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-xl bg-card">
            {isRecording ? (
                <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                    {/* Glowing Mic Visual */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        {!isPaused && <span className="absolute w-full h-full rounded-full bg-red-100 animate-ping opacity-75"></span>}
                        <div className={`relative w-20 h-20 ${isPaused ? 'bg-muted-foreground' : 'bg-red-500'} rounded-full flex items-center justify-center shadow-lg transition-colors duration-300`}>
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {isPaused ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                                )}
                            </svg>
                        </div>
                    </div>
                    
                    {/* Timer and Status */}
                    <div className="text-center">
                        <h3 className="text-3xl font-mono font-bold text-foreground tabular-nums tracking-wider">
                            {formatTime(duration)}
                        </h3>
                        <p className={`text-sm mt-2 font-medium ${isPaused ? 'text-muted-foreground' : 'text-red-500 animate-pulse'}`}>
                            {isPaused ? 'Gravação Pausada' : 'Gravando consulta...'}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3 w-full mt-4">
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1 rounded-xl h-14"
                            onClick={isPaused ? resumeRecording : pauseRecording}
                        >
                            {isPaused ? (
                                <>
                                    <span className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse" />
                                    Retomar
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                    </svg>
                                    Pausar
                                </>
                            )}
                        </Button>
                        <Button
                            variant="destructive"
                            size="lg"
                            className="flex-1 rounded-xl h-14"
                            onClick={stopRecording}
                        >
                            Finalizar
                        </Button>
                    </div>
                    
                    {/* Live Pulse Insights */}
                    <div className={`mt-4 w-full text-center transition-all duration-500 ease-in-out ${currentPulse ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 h-0 overflow-hidden"}`}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/40 rounded-full border border-border/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                            <p className="text-sm font-medium text-foreground">
                                {currentPulse}
                            </p>
                        </div>
                    </div>
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
