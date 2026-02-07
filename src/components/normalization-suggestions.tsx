"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Suggestion {
  id: string;
  type: "CID" | "DCB";
  rawText: string;
  normalizedCode: string | null;
  normalizedLabel: string | null;
  confidence: number | null;
  accepted: boolean;
}

interface NormalizationSuggestionsProps {
  suggestions: Suggestion[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function NormalizationSuggestions({
  suggestions,
  onAccept,
  onReject,
}: NormalizationSuggestionsProps) {
  const [localSuggestions, setLocalSuggestions] = useState(suggestions);

  const handleAccept = (id: string) => {
    setLocalSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, accepted: true } : s))
    );
    onAccept(id);
  };

  const handleReject = (id: string) => {
    setLocalSuggestions((prev) => prev.filter((s) => s.id !== id));
    onReject(id);
  };

  const cidSuggestions = localSuggestions.filter((s) => s.type === "CID");
  const dcbSuggestions = localSuggestions.filter((s) => s.type === "DCB");

  if (localSuggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Sugestões de Padronização
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            Revise cada sugestão
          </Badge>
        </CardTitle>
        <CardDescription>
          Termos identificados que podem ser padronizados para CID-10 ou DCB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {cidSuggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">
              Diagnósticos (CID-10)
            </h4>
            {cidSuggestions.map((suggestion, idx) => (
              <SuggestionItem
                key={`${suggestion.id}-${idx}`}
                suggestion={suggestion}
                onAccept={() => handleAccept(suggestion.id)}
                onReject={() => handleReject(suggestion.id)}
              />
            ))}
          </div>
        )}

        {dcbSuggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">
              Medicamentos (DCB)
            </h4>
            {dcbSuggestions.map((suggestion, idx) => (
              <SuggestionItem
                key={`${suggestion.id}-${idx}`}
                suggestion={suggestion}
                onAccept={() => handleAccept(suggestion.id)}
                onReject={() => handleReject(suggestion.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SuggestionItem({
  suggestion,
  onAccept,
  onReject,
}: {
  suggestion: Suggestion;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (suggestion.accepted) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{suggestion.rawText}</span>
            <span className="text-gray-400">→</span>
            <span className="text-sm text-green-700">
              {suggestion.normalizedCode && (
                <Badge variant="secondary" className="mr-1">
                  {suggestion.normalizedCode}
                </Badge>
              )}
              {suggestion.normalizedLabel}
            </span>
          </div>
        </div>
        <Badge className="bg-green-600">Aceito</Badge>
      </div>
    );
  }

  if (!suggestion.normalizedCode) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
        <div className="flex-1">
          <span className="text-sm font-medium">{suggestion.rawText}</span>
          <span className="text-sm text-gray-500 ml-2">
            (sem correspondência encontrada)
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onReject}>
          Ignorar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{suggestion.rawText}</span>
          <span className="text-gray-400">→</span>
          <span className="text-sm">
            <Badge variant="secondary" className="mr-1">
              {suggestion.normalizedCode}
            </Badge>
            {suggestion.normalizedLabel}
          </span>
          {suggestion.confidence && (
            <Badge variant="outline" className="text-xs">
              {Math.round(suggestion.confidence * 100)}% confiança
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onReject}>
          Rejeitar
        </Button>
        <Button size="sm" onClick={onAccept}>
          Aceitar
        </Button>
      </div>
    </div>
  );
}
