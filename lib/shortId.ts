/**
 * The first 8 hex digits of a record id, for showing it to people: ids are
 * UUIDs (ADR-0009 in the backend), and 8 digits are enough to tell records
 * apart on a screen without a 36-character string in every label.
 */
export function shortId(id: string): string {
  return id.slice(0, 8);
}
