import Fuse from "fuse.js";
import cid10Data from "@/data/cid10.json";
import dcbData from "@/data/dcb.json";

interface CID10Entry {
  code: string;
  label: string;
}

interface DCBEntry {
  name: string;
  dcb: string;
  aliases: string[];
}

interface NormalizationSuggestion {
  type: "CID" | "DCB";
  rawText: string;
  normalizedCode: string | null;
  normalizedLabel: string | null;
  confidence: number | null;
}

// Initialize Fuse instances
const cidFuse = new Fuse(cid10Data as CID10Entry[], {
  keys: ["label", "code"],
  threshold: 0.4,
  includeScore: true,
});

// Create searchable array for DCB with aliases
const dcbSearchable = (dcbData as DCBEntry[]).flatMap((entry) => [
  { ...entry, searchName: entry.name },
  ...entry.aliases.map((alias) => ({ ...entry, searchName: alias })),
]);

const dcbFuse = new Fuse(dcbSearchable, {
  keys: ["searchName", "name", "dcb"],
  threshold: 0.3,
  includeScore: true,
});

export function normalizeDiagnosis(rawText: string): NormalizationSuggestion {
  const result = cidFuse.search(rawText.toLowerCase());

  if (result.length > 0 && result[0].score !== undefined) {
    const confidence = 1 - result[0].score;
    return {
      type: "CID",
      rawText,
      normalizedCode: result[0].item.code,
      normalizedLabel: result[0].item.label,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  return {
    type: "CID",
    rawText,
    normalizedCode: null,
    normalizedLabel: null,
    confidence: null,
  };
}

export function normalizeMedication(rawText: string): NormalizationSuggestion {
  const result = dcbFuse.search(rawText.toLowerCase());

  if (result.length > 0 && result[0].score !== undefined) {
    const confidence = 1 - result[0].score;
    return {
      type: "DCB",
      rawText,
      normalizedCode: result[0].item.name,
      normalizedLabel: result[0].item.dcb,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  return {
    type: "DCB",
    rawText,
    normalizedCode: null,
    normalizedLabel: null,
    confidence: null,
  };
}

export async function normalizeTerms(
  mentions: { medications: string[]; diagnoses: string[] },
  visitId: string
): Promise<Array<NormalizationSuggestion & { visitId: string }>> {
  const suggestions: Array<NormalizationSuggestion & { visitId: string }> = [];

  // Normalize diagnoses
  for (const diagnosis of mentions.diagnoses) {
    if (diagnosis && diagnosis.trim()) {
      const suggestion = normalizeDiagnosis(diagnosis);
      suggestions.push({ ...suggestion, visitId });
    }
  }

  // Normalize medications
  for (const medication of mentions.medications) {
    if (medication && medication.trim()) {
      const suggestion = normalizeMedication(medication);
      suggestions.push({ ...suggestion, visitId });
    }
  }

  return suggestions;
}

// Export for direct use
export function searchCID(query: string, limit = 10): CID10Entry[] {
  const results = cidFuse.search(query, { limit });
  return results.map((r) => r.item);
}

export function searchDCB(query: string, limit = 10): DCBEntry[] {
  const results = dcbFuse.search(query, { limit });
  // Remove duplicates by name
  const seen = new Set<string>();
  return results
    .map((r) => r.item)
    .filter((item) => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
}
