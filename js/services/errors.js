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
