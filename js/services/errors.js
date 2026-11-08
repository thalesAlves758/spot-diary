/**
 * Thrown by services when user input breaks a business rule.
 * `fields` maps a field name to a message ready to show in the UI, e.g. `{ name: 'Nome já cadastrado' }`.
 */
export class ValidationError extends Error {
  constructor(fields) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/**
 * Thrown when a backup file can't be imported. `message` is ready to show in the UI;
 * `details` lists specific problems (e.g. "Lugar 3: tipo inválido"). Nothing was written.
 */
export class ImportError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ImportError';
    this.details = details;
  }
}

/** Thrown when a record the user is acting on no longer exists (e.g. deleted in another tab). */
export class NotFoundError extends Error {
  constructor(kind, id) {
    super(`${kind} not found: ${id}`);
    this.name = 'NotFoundError';
    this.kind = kind;
    this.id = id;
  }
}
