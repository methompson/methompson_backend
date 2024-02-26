import { ActionBankUser, ActionBankUserJSON } from './action_bank_user';

describe('ActionBankUser', () => {
  const validInput: ActionBankUserJSON = {
    id: 'id',
    name: 'name',
    currentTokens: 1,
  };

  describe('toJSON', () => {
    test('returns an expected value', () => {
      const actionBankUser = ActionBankUser.fromJSON(validInput);

      const result = actionBankUser.toJSON();

      expect(result).toEqual(validInput);
    });
  });

  describe('fromJSON', () => {
    test('returns a new ActionBankUser based on valid input', () => {
      const result = ActionBankUser.fromJSON(validInput);
      expect(result instanceof ActionBankUser).toBe(true);
      expect(result.id).toBe('id');
      expect(result.name).toBe('name');
      expect(result.currentTokens).toBe(1);
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => ActionBankUser.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(() => ActionBankUser.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.currentTokens;
      expect(() => ActionBankUser.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if the input is not an object', () => {
      expect(() => ActionBankUser.fromJSON('invalidInput')).toThrow();
      expect(() => ActionBankUser.fromJSON(1)).toThrow();
      expect(() => ActionBankUser.fromJSON(true)).toThrow();
      expect(() => ActionBankUser.fromJSON([])).toThrow();
      expect(() => ActionBankUser.fromJSON(null)).toThrow();
    });
  });

  describe('isActionBankUserJSON', () => {
    test('returns true if the input is valid', () => {
      expect(ActionBankUser.isActionBankUserJSON(validInput)).toBe(true);
    });

    test('returns false if the input is missing any value from a valid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(ActionBankUser.isActionBankUserJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(ActionBankUser.isActionBankUserJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.currentTokens;
      expect(ActionBankUser.isActionBankUserJSON(invalidInput)).toBe(false);
    });

    test('returns false if the input is not an object', () => {
      expect(ActionBankUser.isActionBankUserJSON('invalidInput')).toBe(false);
      expect(ActionBankUser.isActionBankUserJSON(1)).toBe(false);
      expect(ActionBankUser.isActionBankUserJSON(true)).toBe(false);
      expect(ActionBankUser.isActionBankUserJSON([])).toBe(false);
      expect(ActionBankUser.isActionBankUserJSON(null)).toBe(false);
    });
  });

  describe('ActionBankUserJSONTest', () => {
    test('returns an empty array if the input is valid', () => {
      expect(ActionBankUser.ActionBankUserJSONTest(validInput)).toEqual([]);
    });

    test('returns an array of strings if the input is missing any value from a valid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(ActionBankUser.ActionBankUserJSONTest(invalidInput)).toEqual([
        'id',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(ActionBankUser.ActionBankUserJSONTest(invalidInput)).toEqual([
        'name',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.currentTokens;
      expect(ActionBankUser.ActionBankUserJSONTest(invalidInput)).toEqual([
        'currentTokens',
      ]);
    });

    test('returns root if the input is not an object', () => {
      expect(ActionBankUser.ActionBankUserJSONTest('invalidInput')).toEqual([
        'root',
      ]);
      expect(ActionBankUser.ActionBankUserJSONTest(1)).toEqual(['root']);
      expect(ActionBankUser.ActionBankUserJSONTest(true)).toEqual(['root']);
      expect(ActionBankUser.ActionBankUserJSONTest([])).toEqual(['root']);
      expect(ActionBankUser.ActionBankUserJSONTest(null)).toEqual(['root']);
    });
  });

  describe('fromNewActionBankUser', () => {
    test('returns a new ActionBankUser based on valid input', () => {
      const userInput = ActionBankUser.fromJSON(validInput);
      const newId = 'newId';
      const result = ActionBankUser.fromNewActionBankUser(newId, userInput);

      expect(result instanceof ActionBankUser).toBe(true);
      expect(result.id).toBe(newId);
      expect(result.name).toBe(userInput.name);
      expect(result.currentTokens).toBe(userInput.currentTokens);
    });
  });
});
