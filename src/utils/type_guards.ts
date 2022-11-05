export function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    !isNullOrUndefined(value) &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return isNull(value) || isUndefined(value);
}

export function isStringArray(value: unknown): value is string[] {
  if (Array.isArray(value)) {
    for (const t of value) {
      if (!isString(t)) {
        return false;
      }
    }
  } else {
    // If not an array, just return false
    return false;
  }

  return true;
}
