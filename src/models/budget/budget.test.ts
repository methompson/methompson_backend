import { Budget, BudgetJSON } from './budget';

describe('Budget', () => {
  const id = 'id';
  const userId = 'userId';
  const name = 'name';

  const validInput: BudgetJSON = {
    id,
    userId,
    name,
  };

  describe('toJSON', () => {
    test('returns a BudgetJSON object', () => {
      const budget = new Budget(id, userId, name);

      expect(budget.toJSON()).toEqual(validInput);
    });
  });

  describe('fromJSON', () => {
    test('returns a Budget object', () => {
      const budget = Budget.fromJSON(validInput);

      expect(budget).toBeInstanceOf(Budget);
      expect(budget.toJSON()).toEqual(validInput);
    });

    test('toJSON can be piped into fromJSON', () => {
      const budget1 = Budget.fromJSON(validInput);
      const budget2 = Budget.fromJSON(budget1.toJSON());

      expect(budget1.toJSON()).toEqual(budget2.toJSON());
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(() => Budget.fromJSON(invalidInput)).not.toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => Budget.fromJSON(invalidInput)).toThrow('Invalid JSON id');

      invalidInput = { ...validInput };
      delete invalidInput.userId;
      expect(() => Budget.fromJSON(invalidInput)).toThrow(
        'Invalid JSON userId',
      );

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(() => Budget.fromJSON(invalidInput)).toThrow('Invalid JSON name');
    });

    test('throws an error when the input is not an object', () => {
      expect(() => Budget.fromJSON('string')).toThrow();
      expect(() => Budget.fromJSON(1)).toThrow();
      expect(() => Budget.fromJSON(true)).toThrow();
      expect(() => Budget.fromJSON([])).toThrow();
      expect(() => Budget.fromJSON(null)).toThrow();
    });
  });

  describe('isBudgetJSON', () => {
    test('returns true if the input is a BudgetJSON object', () => {
      expect(Budget.isBudgetJSON(validInput)).toBe(true);
    });

    test('returns false if the input is missing values', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      expect(Budget.isBudgetJSON(invalidInput)).toBe(true);

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(Budget.isBudgetJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.userId;
      expect(Budget.isBudgetJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(Budget.isBudgetJSON(invalidInput)).toBe(false);
    });

    test('returns false if the input is not an object', () => {
      expect(Budget.isBudgetJSON('string')).toBe(false);
      expect(Budget.isBudgetJSON(1)).toBe(false);
      expect(Budget.isBudgetJSON(true)).toBe(false);
      expect(Budget.isBudgetJSON([])).toBe(false);
      expect(Budget.isBudgetJSON(null)).toBe(false);
    });
  });

  describe('budgetJSONTest', () => {
    test('returns an empty array if the input is valid', () => {
      expect(Budget.budgetJSONTest(validInput)).toEqual([]);
    });

    test('returns an array of strings if the input is invalid', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(Budget.budgetJSONTest(invalidInput)).toEqual([]);

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(Budget.budgetJSONTest(invalidInput)).toEqual(['id']);

      invalidInput = { ...validInput };
      delete invalidInput.userId;
      expect(Budget.budgetJSONTest(invalidInput)).toEqual(['userId']);

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(Budget.budgetJSONTest(invalidInput)).toEqual(['name']);
    });

    test('returns an array with "root" if the input is not an object', () => {
      expect(Budget.budgetJSONTest('string')).toEqual(['root']);
      expect(Budget.budgetJSONTest(1)).toEqual(['root']);
      expect(Budget.budgetJSONTest(true)).toEqual(['root']);
      expect(Budget.budgetJSONTest([])).toEqual(['root']);
      expect(Budget.budgetJSONTest(null)).toEqual(['root']);
    });
  });
});
