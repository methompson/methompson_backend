import { ViceBankUser, ViceBankUserJSON } from './vice_bank_user';

describe('ViceBankUser', () => {
  const validInput: ViceBankUserJSON = {
    id: 'id',
    name: 'name',
    currentTokens: 1,
  };

  describe('toJSON', () => {
    test('returns an expected value', () => {
      const viceBankUser = ViceBankUser.fromJSON(validInput);

      const result = viceBankUser.toJSON();

      expect(result).toEqual(validInput);
    });
  });

  describe('fromJSON', () => {
    test('returns a new ViceBankUser based on valid input', () => {
      const result = ViceBankUser.fromJSON(validInput);
      expect(result instanceof ViceBankUser).toBe(true);
      expect(result.id).toBe('id');
      expect(result.name).toBe('name');
      expect(result.currentTokens).toBe(1);
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => ViceBankUser.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(() => ViceBankUser.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.currentTokens;
      expect(() => ViceBankUser.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if the input is not an object', () => {
      expect(() => ViceBankUser.fromJSON('invalidInput')).toThrow();
      expect(() => ViceBankUser.fromJSON(1)).toThrow();
      expect(() => ViceBankUser.fromJSON(true)).toThrow();
      expect(() => ViceBankUser.fromJSON([])).toThrow();
      expect(() => ViceBankUser.fromJSON(null)).toThrow();
    });
  });

  describe('isViceBankUserJSON', () => {
    test('returns true if the input is valid', () => {
      expect(ViceBankUser.isViceBankUserJSON(validInput)).toBe(true);
    });

    test('returns false if the input is missing any value from a valid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(ViceBankUser.isViceBankUserJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(ViceBankUser.isViceBankUserJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.currentTokens;
      expect(ViceBankUser.isViceBankUserJSON(invalidInput)).toBe(false);
    });

    test('returns false if the input is not an object', () => {
      expect(ViceBankUser.isViceBankUserJSON('invalidInput')).toBe(false);
      expect(ViceBankUser.isViceBankUserJSON(1)).toBe(false);
      expect(ViceBankUser.isViceBankUserJSON(true)).toBe(false);
      expect(ViceBankUser.isViceBankUserJSON([])).toBe(false);
      expect(ViceBankUser.isViceBankUserJSON(null)).toBe(false);
    });
  });

  describe('ViceBankUserJSONTest', () => {
    test('returns an empty array if the input is valid', () => {
      expect(ViceBankUser.ViceBankUserJSONTest(validInput)).toEqual([]);
    });

    test('returns an array of strings if the input is missing any value from a valid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(ViceBankUser.ViceBankUserJSONTest(invalidInput)).toEqual(['id']);

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(ViceBankUser.ViceBankUserJSONTest(invalidInput)).toEqual(['name']);

      invalidInput = { ...validInput };
      delete invalidInput.currentTokens;
      expect(ViceBankUser.ViceBankUserJSONTest(invalidInput)).toEqual([
        'currentTokens',
      ]);
    });

    test('returns root if the input is not an object', () => {
      expect(ViceBankUser.ViceBankUserJSONTest('invalidInput')).toEqual([
        'root',
      ]);
      expect(ViceBankUser.ViceBankUserJSONTest(1)).toEqual(['root']);
      expect(ViceBankUser.ViceBankUserJSONTest(true)).toEqual(['root']);
      expect(ViceBankUser.ViceBankUserJSONTest([])).toEqual(['root']);
      expect(ViceBankUser.ViceBankUserJSONTest(null)).toEqual(['root']);
    });
  });

  describe('fromNewViceBankUser', () => {
    test('returns a new ViceBankUser based on valid input', () => {
      const userInput = ViceBankUser.fromJSON(validInput);
      const newId = 'newId';
      const result = ViceBankUser.fromNewViceBankUser(newId, userInput);

      expect(result instanceof ViceBankUser).toBe(true);
      expect(result.id).toBe(newId);
      expect(result.name).toBe(userInput.name);
      expect(result.currentTokens).toBe(userInput.currentTokens);
    });
  });
});
