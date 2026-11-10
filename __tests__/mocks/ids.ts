/**
 * Fixed, readable UUIDs for tests (ids are UUIDs since ADR-0009 in the backend):
 * uid(7) is "00000000-0000-4000-8000-000000000007", a valid version-4 UUID, so it
 * passes the forms' zod `.uuid()` validation like a real id does.
 */
export function uid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}
