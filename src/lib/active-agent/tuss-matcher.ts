import Fuse from "fuse.js";
import tussCodesData from "@/data/tuss-codes.json";
import { TussCode, TussProcedure } from "@/types/active-agent";

// Convert JSON data to typed array
const tussCodes: TussCode[] = tussCodesData.map((item) => ({
  id: item.code,
  code: item.code,
  description: item.description,
  table: item.table,
  category: item.category,
  synonyms: item.synonyms,
}));

// Create searchable index combining description and synonyms
const searchableItems = tussCodes.map((code) => ({
  ...code,
  searchText: [
    code.description,
    code.code,
    ...(code.synonyms || []),
  ].join(" "),
}));

// Configure Fuse.js for fuzzy matching
const fuse = new Fuse(searchableItems, {
  keys: [
    { name: "description", weight: 0.4 },
    { name: "searchText", weight: 0.3 },
    { name: "synonyms", weight: 0.2 },
    { name: "code", weight: 0.1 },
  ],
  threshold: 0.4, // Lower = more strict matching
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 3,
});

export interface TussMatchResult {
  code: TussCode;
  confidence: number;
}

/**
 * Find TUSS codes matching a procedure name
 */
export function findTussCodes(
  procedureName: string,
  limit = 5
): TussMatchResult[] {
  const results = fuse.search(procedureName, { limit });

  return results.map((result) => ({
    code: {
      id: result.item.id,
      code: result.item.code,
      description: result.item.description,
      table: result.item.table,
      category: result.item.category,
      synonyms: result.item.synonyms,
    },
    confidence: 1 - (result.score || 0),
  }));
}

/**
 * Get best matching TUSS code for a procedure
 */
export function getBestTussMatch(
  procedureName: string
): TussMatchResult | null {
  const results = findTussCodes(procedureName, 1);
  return results.length > 0 ? results[0] : null;
}

/**
 * Convert detected procedures to TUSS procedures with codes
 */
export function matchProceduresToTuss(
  detectedProcedures: Array<{
    name: string;
    urgency: "routine" | "urgent" | "emergency";
    quantity?: number;
    sourceText: string;
  }>
): TussProcedure[] {
  return detectedProcedures
    .map((proc) => {
      const match = getBestTussMatch(proc.name);

      if (!match || match.confidence < 0.3) {
        // Return without TUSS code if no good match
        return {
          code: "",
          description: proc.name,
          table: "22",
          quantity: proc.quantity || 1,
          matchConfidence: 0,
        };
      }

      return {
        code: match.code.code,
        description: match.code.description,
        table: match.code.table,
        quantity: proc.quantity || 1,
        matchConfidence: match.confidence,
      };
    })
    .filter((proc) => proc.matchConfidence > 0.3 || proc.code === "");
}

/**
 * Search TUSS codes by text (for autocomplete/search UI)
 */
export function searchTussCodes(query: string, limit = 10): TussCode[] {
  if (!query || query.length < 2) return [];

  const results = fuse.search(query, { limit });
  return results.map((r) => ({
    id: r.item.id,
    code: r.item.code,
    description: r.item.description,
    table: r.item.table,
    category: r.item.category,
    synonyms: r.item.synonyms,
  }));
}

/**
 * Get all TUSS codes (for seeding database)
 */
export function getAllTussCodes(): TussCode[] {
  return tussCodes;
}

/**
 * Get TUSS code by exact code
 */
export function getTussCodeByCode(code: string): TussCode | undefined {
  return tussCodes.find((t) => t.code === code);
}
