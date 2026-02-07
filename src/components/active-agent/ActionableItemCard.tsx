"use client";

import { ActionableItem, TissMetadata } from "@/types/active-agent";

interface ActionableItemCardProps {
  item: ActionableItem;
  onAction: (action: "accept" | "dismiss") => void;
}

const ITEM_CONFIG = {
  tiss_form: {
    title: "Guia TISS",
    actionLabel: "Gerar Guia",
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600",
    buttonColor: "bg-green-600 hover:bg-green-700",
  },
  referral_letter: {
    title: "Encaminhamento",
    actionLabel: "Criar Carta",
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconColor: "text-purple-600",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
  },
  follow_up: {
    title: "Retorno",
    actionLabel: "Agendar",
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
};

function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 0.8) return { label: "Alta", color: "text-green-600" };
  if (confidence >= 0.5) return { label: "Media", color: "text-yellow-600" };
  return { label: "Baixa", color: "text-red-600" };
}

function getItemDescription(item: ActionableItem): string {
  if (item.type === "tiss_form") {
    const metadata = item.metadata as TissMetadata;
    const count = metadata.procedureCodes?.length || 0;
    const names = metadata.procedureCodes
      ?.slice(0, 2)
      .map((p) => p.description)
      .join(", ");
    const suffix = count > 2 ? ` +${count - 2}` : "";
    return `${count} procedimento${count !== 1 ? "s" : ""}: ${names}${suffix}`;
  }
  return item.sourceText?.slice(0, 100) || "";
}

export function ActionableItemCard({ item, onAction }: ActionableItemCardProps) {
  const config = ITEM_CONFIG[item.type];
  const confidence = getConfidenceLabel(item.confidence);

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg bg-white shadow-sm`}>
          {item.type === "tiss_form" && (
            <svg
              className={`w-5 h-5 ${config.iconColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          )}
          {item.type === "referral_letter" && (
            <svg
              className={`w-5 h-5 ${config.iconColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          )}
          {item.type === "follow_up" && (
            <svg
              className={`w-5 h-5 ${config.iconColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 text-sm">{config.title}</span>
            <span className={`text-xs ${confidence.color}`}>
              {confidence.label} ({Math.round(item.confidence * 100)}%)
            </span>
          </div>

          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {getItemDescription(item)}
          </p>

          {item.sourceText && (
            <p className="text-xs text-gray-400 italic line-clamp-1">
              &ldquo;{item.sourceText.slice(0, 80)}...&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onAction("dismiss")}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Dispensar
        </button>
        <button
          onClick={() => onAction("accept")}
          className={`flex-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors ${config.buttonColor}`}
        >
          {config.actionLabel}
        </button>
      </div>
    </div>
  );
}
