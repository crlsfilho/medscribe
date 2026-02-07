"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TranscriptSegment {
  id: string;
  speaker: "doctor" | "patient" | "unknown";
  text: string;
  confidence: number;
  timestamp: string;
}

interface TranscriptionReviewProps {
  transcription: string;
  onConfirm: (editedTranscription: string) => void;
  onEdit: () => void;
  disabled?: boolean;
}

// Parse transcription into segments with speaker detection
function parseTranscription(text: string): TranscriptSegment[] {
  // Split by double newlines (paragraph breaks) or speaker changes
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  const segments: TranscriptSegment[] = [];

  // Regex patterns for speaker detection
  const speakerPatterns = [
    { pattern: /^medico:\s*/i, speaker: "doctor" as const, confidence: 0.95 },
    { pattern: /^doutor:\s*/i, speaker: "doctor" as const, confidence: 0.95 },
    { pattern: /^dra?\.?\s*:/i, speaker: "doctor" as const, confidence: 0.95 },
    { pattern: /^paciente:\s*/i, speaker: "patient" as const, confidence: 0.95 },
    { pattern: /^desconhecido:\s*/i, speaker: "unknown" as const, confidence: 0.5 },
  ];

  // Keywords for fallback detection
  const doctorKeywords = [
    "vou examinar", "vou prescrever", "receitar", "prescre",
    "diagnostico", "tratamento", "retorno", "exame", "medicamento",
    "orientacao", "tome", "comprimido", "uso continuo", "mg por dia",
    "voce precisa", "recomendo", "indico", "vou pedir", "faca uso",
    "evite", "nao pode", "deve", "importante que voce",
  ];

  const patientKeywords = [
    "estou sentindo", "sinto", "comecou", "sintoma", "incomodo",
    "percebi", "notei", "melhora", "piora", "tomei", "uso",
    "dor", "doi", "inchado", "vermelho", "coceira", "tosse",
    "febre", "nausea", "tontura", "cansaco", "falta de ar",
    "ha dias", "ha semanas", "desde", "quando acordo", "a noite",
    "minha mae", "meu pai", "na familia",
  ];

  paragraphs.forEach((paragraph) => {
    const lines = paragraph.split("\n").filter((l) => l.trim());

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      let speaker: "doctor" | "patient" | "unknown" = "unknown";
      let confidence = 0.5;
      let cleanText = trimmedLine;

      // Check for explicit speaker markers
      for (const { pattern, speaker: s, confidence: c } of speakerPatterns) {
        if (pattern.test(trimmedLine)) {
          speaker = s;
          confidence = c;
          cleanText = trimmedLine.replace(pattern, "").trim();
          break;
        }
      }

      // If no explicit marker, use keyword detection
      if (speaker === "unknown") {
        const lowerLine = trimmedLine.toLowerCase();

        const doctorScore = doctorKeywords.filter((kw) =>
          lowerLine.includes(kw)
        ).length;
        const patientScore = patientKeywords.filter((kw) =>
          lowerLine.includes(kw)
        ).length;

        if (doctorScore > 0 && doctorScore > patientScore) {
          speaker = "doctor";
          confidence = Math.min(0.6 + doctorScore * 0.1, 0.85);
        } else if (patientScore > 0 && patientScore > doctorScore) {
          speaker = "patient";
          confidence = Math.min(0.6 + patientScore * 0.1, 0.85);
        } else {
          // Use question heuristic - doctors often ask questions
          const isQuestion = trimmedLine.includes("?");
          const startsWithQuestion = /^(o que|como|quando|onde|qual|quanto|por que|voce|esta|sente|tem)/i.test(trimmedLine);

          if (isQuestion || startsWithQuestion) {
            speaker = "doctor";
            confidence = 0.6;
          }
        }
      }

      segments.push({
        id: `seg-${segments.length}`,
        speaker,
        text: cleanText,
        confidence,
        timestamp: formatTimestamp(segments.length * 12),
      });
    });
  });

  // If we only got one segment from a long text, try splitting by sentences
  if (segments.length === 1 && text.length > 200) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length > 1) {
      return sentences.map((sentence, idx) => ({
        id: `seg-${idx}`,
        speaker: "unknown" as const,
        text: sentence.trim(),
        confidence: 0.5,
        timestamp: formatTimestamp(idx * 10),
      }));
    }
  }

  return segments;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function TranscriptionReview({
  transcription,
  onConfirm,
  onEdit,
  disabled,
}: TranscriptionReviewProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>(() =>
    parseTranscription(transcription)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleSpeakerChange = (
    id: string,
    newSpeaker: "doctor" | "patient" | "unknown"
  ) => {
    setSegments((prev) =>
      prev.map((seg) =>
        seg.id === id ? { ...seg, speaker: newSpeaker, confidence: 1 } : seg
      )
    );
  };

  const handleEditStart = (segment: TranscriptSegment) => {
    setEditingId(segment.id);
    setEditText(segment.text);
  };

  const handleEditSave = (id: string) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, text: editText } : seg))
    );
    setEditingId(null);
    setEditText("");
  };

  const handleConfirm = () => {
    const formattedText = segments
      .map((seg) => {
        const prefix =
          seg.speaker === "doctor"
            ? "Medico: "
            : seg.speaker === "patient"
              ? "Paciente: "
              : "";
        return prefix + seg.text;
      })
      .join("\n\n");
    onConfirm(formattedText);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-[oklch(0.55_0.15_160)]";
    if (confidence >= 0.7) return "text-[oklch(0.65_0.15_80)]";
    return "text-[oklch(0.55_0.18_25)]";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return "Alta";
    if (confidence >= 0.7) return "Media";
    return "Baixa";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Revisar Transcricao
          </h3>
          <p className="text-sm text-muted-foreground">
            Verifique e corrija a atribuicao de falas
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Medico
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[oklch(0.60_0.15_280)]"></span>
            Paciente
          </span>
        </div>
      </div>

      {/* Transcript segments */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`p-4 rounded-xl border transition-colors ${
              segment.speaker === "doctor"
                ? "bg-primary/5 border-primary/20"
                : segment.speaker === "patient"
                  ? "bg-[oklch(0.95_0.02_280)] border-[oklch(0.85_0.05_280)]"
                  : "bg-muted/50 border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {/* Speaker selector */}
                <select
                  value={segment.speaker}
                  onChange={(e) =>
                    handleSpeakerChange(
                      segment.id,
                      e.target.value as "doctor" | "patient" | "unknown"
                    )
                  }
                  className="text-xs font-medium px-2 py-1 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={disabled}
                >
                  <option value="doctor">Medico</option>
                  <option value="patient">Paciente</option>
                  <option value="unknown">Desconhecido</option>
                </select>

                {/* Timestamp */}
                <span className="text-xs text-muted-foreground font-mono">
                  {segment.timestamp}
                </span>
              </div>

              {/* Confidence indicator */}
              <div
                className={`flex items-center gap-1 text-xs ${getConfidenceColor(segment.confidence)}`}
              >
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
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{getConfidenceLabel(segment.confidence)}</span>
                <span className="text-muted-foreground">
                  ({Math.round(segment.confidence * 100)}%)
                </span>
              </div>
            </div>

            {/* Text content */}
            {editingId === segment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 text-sm rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  disabled={disabled}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditSave(segment.id)}
                    disabled={disabled}
                    className="text-xs"
                  >
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    disabled={disabled}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground leading-relaxed">
                  {segment.text}
                </p>
                <button
                  onClick={() => handleEditStart(segment)}
                  disabled={disabled}
                  className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleConfirm}
          className="flex-1 h-12 rounded-xl"
          disabled={disabled}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
          Confirmar Transcricao
        </Button>
        <Button
          onClick={onEdit}
          variant="outline"
          className="h-12 rounded-xl px-6"
          disabled={disabled}
        >
          Editar Tudo
        </Button>
      </div>

      {/* AI Notice */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
        <svg
          className="w-4 h-4 mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
          />
        </svg>
        <span>
          A separacao de falas foi gerada automaticamente por IA. Revise e
          corrija conforme necessario.
        </span>
      </div>
    </div>
  );
}
