function isRecord(value: unknown): value is Record<string, unknown> {
  const val = value as Record<string, unknown>;

  return typeof val === 'object' && !Array.isArray(val);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

export {
  isRecord,
  isString,
  isNumber,
  isBoolean,
  isDate,
};