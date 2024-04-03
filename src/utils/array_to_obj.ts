export function listToMap<T>(
  input: T[],
  keygen: (input: T) => string | number,
): Record<string | number, T> {
  return listToObject(input, keygen);
}

// Converts an array of values to an object.
// The keygen allows you to determine which value is the key.
// e.g. you can select an id, or a name or some other unique value.
export function listToObject<T>(
  input: T[],
  keygen: (input: T) => string | number,
): Record<string | number, T> {
  const output: Record<string | number, T> = {};

  for (const i of input) {
    output[keygen(i)] = i;
  }

  return output;
}

export function listToMappedObject<T, U>(
  input: T[],
  keygen: (input: T) => string | number,
  map: (input: T) => U,
): Record<string | number, U> {
  const output: Record<string | number, U> = {};

  for (const i of input) {
    output[keygen(i)] = map(i);
  }

  return output;
}
