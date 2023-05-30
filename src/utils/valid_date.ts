import { isDate, isString } from '@/src/utils/type_guards';

export type ValidDate = Date;

export function isValidDate(value: unknown): value is ValidDate {
  return isDate(value) && !Number.isNaN(value.getTime());
}

export type ValidDateString = string;

export function isValidDateString(value: unknown): value is ValidDateString {
  if (!isString(value)) {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}
