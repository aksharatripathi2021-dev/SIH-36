/**
 * Strict LMO Jurisdiction Normalization Utility
 * Prompt 10A Compliance
 *
 * Normalizes zone labels into sorted, canonical token sets to allow harmless
 * word order, separator, and generic descriptor differences ("Delhi South Zone"
 * vs "South Delhi Zone" vs "Delhi-South-Zone") while strictly rejecting cross-zone
 * mismatches ("Delhi North", "Mumbai South", "Delhi Central").
 */

/**
 * Normalizes a zone string into a canonical, sorted array of meaningful location tokens.
 *
 * Rules:
 * 1. Convert to lowercase.
 * 2. Replace punctuation and separators (/ - , _ . | :) with spaces.
 * 3. Split into tokens and collapse repeated whitespace.
 * 4. Remove only harmless generic zone descriptors ("zone").
 * 5. Sort remaining tokens alphabetically.
 * 6. Returns [] for null, undefined, or empty inputs.
 */
export function normalizeZoneLabel(zone?: string | null): string[] {
  if (!zone || typeof zone !== "string") {
    return [];
  }

  // 1. Lowercase
  const lower = zone.toLowerCase();

  // 2. Replace punctuation/separators with whitespace
  const sanitized = lower.replace(/[/\\_\-,.|:;()[\]{}]+/g, " ");

  // 3. Split on whitespace, filter empty
  const rawTokens = sanitized.split(/\s+/).filter(Boolean);

  // 4. Remove only generic zone descriptors ("zone")
  const filteredTokens = rawTokens.filter((token) => token !== "zone");

  // 5. Sort remaining tokens alphabetically
  filteredTokens.sort();

  return filteredTokens;
}

/**
 * Strict equality comparison of normalized zone tokens.
 *
 * Both zoneA and zoneB must resolve to non-empty token arrays, and must have
 * identical token counts and identical tokens at every position.
 *
 * A normalization failure or mismatch results in false (NO ACCESS).
 */
export function zonesMatch(zoneA?: string | null, zoneB?: string | null): boolean {
  const tokensA = normalizeZoneLabel(zoneA);
  const tokensB = normalizeZoneLabel(zoneB);

  // If either zone is empty or undefined, access is strictly denied (no match)
  if (tokensA.length === 0 || tokensB.length === 0) {
    return false;
  }

  if (tokensA.length !== tokensB.length) {
    return false;
  }

  return tokensA.every((token, index) => token === tokensB[index]);
}
