/** New ID generated on the device (UUID v4). */
export function newId() {
  return crypto.randomUUID();
}

/** Current date and time in ISO 8601 (UTC). */
export function nowISO() {
  return new Date().toISOString();
}

/**
 * Prepares a record for writing: fills `id` and `createdAt` if missing and refreshes `updatedAt`.
 * Does not mutate the given object.
 */
export function stamp(record, now = nowISO()) {
  return {
    ...record,
    id: record.id ?? newId(),
    createdAt: record.createdAt ?? now,
    updatedAt: now,
  };
}
