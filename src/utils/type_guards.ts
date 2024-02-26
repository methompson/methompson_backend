import { DateTime } from 'luxon';

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

export function isPromiseRejected(
  input: PromiseSettledResult<unknown>,
): input is PromiseRejectedResult {
  return input.status === 'rejected';
}

export function isPromiseFulfilled<T>(
  input: PromiseSettledResult<T>,
): input is PromiseFulfilledResult<T> {
  return input.status === 'fulfilled';
}

export function isError(input: unknown): input is Error {
  return isRecord(input) && input instanceof Error;
}

export type ValidDateTime = DateTime;
export type ValidDateTimeString = string;
export type ValidTimeString = string;

export function isValidDateTime(input: unknown): input is ValidDateTime {
  if (!DateTime.isDateTime(input)) return false;

  return !Number.isNaN(input.toMillis());
}

export function isValidTime(input: unknown): boolean {
  if (!isString(input)) return false;

  return DateTime.fromFormat(input, 'H:mm').isValid;
}

export function isValidTimeString(input: unknown): input is ValidTimeString {
  return isValidTime(input);
}

export function isValidDateTimeString(
  input: unknown,
): input is ValidDateTimeString {
  if (!isString(input)) return false;

  const date = DateTime.fromISO(input);

  return isValidDateTime(date);
}
