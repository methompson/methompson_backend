import { isArray, isRecord } from './type_guards';

interface MakeTypeGuardInterface {
  [key: string]: (input: unknown) => boolean;
}

type TypeGuardTestInput =
  | ((input: unknown) => boolean)
  | ((input: unknown) => string[]);

interface MakeTypeGuardTestInput {
  [key: string]: TypeGuardTestInput;
}

export function makeTypeGuardTest(
  input: MakeTypeGuardTestInput,
): (input: unknown) => string[] {
  return (valueInput: unknown): string[] => {
    if (!isRecord(valueInput)) {
      return ['root'];
    }

    const outputRaw = Object.entries(input).map(([key, value]) => {
      const rawResult = value?.(valueInput[key]);
      const result = isArray(rawResult) ? rawResult.length === 0 : rawResult;

      return !result ? key : undefined;
    });
    const output = outputRaw.filter((value) => value !== undefined);

    return output;
  };
}

export function makeTypeGuard<T>(
  input: MakeTypeGuardInterface,
): (input: unknown) => input is T {
  return (valueInput: unknown): valueInput is T => {
    if (!isRecord(valueInput)) {
      return false;
    }

    return Object.entries(input).every(
      ([key, value]) => value?.(valueInput[key]) ?? false,
    );
  };
}
