import { Expense, ExpenseJSON } from './expense';
import { ExpenseTargetJSON, MonthlyExpenseTarget } from './expense_target';

describe('Expense', () => {
  const id = 'id';
  const budgetId = 'budgetId';
  const categoryId = 'categoryId';
  const description = 'description';
  const amount = 1;
  const expenseTarget: ExpenseTargetJSON = {
    type: 'monthly',
    data: JSON.stringify({ dayOfMonth: 1 }),
  };

  const validInput: ExpenseJSON = {
    id,
    budgetId,
    categoryId,
    description,
    amount,
    expenseTarget,
  };

  describe('toJSON', () => {
    test('exports expected data', () => {
      const expense = Expense.fromJSON(validInput);

      const json = expense.toJSON();
      expect(json).toEqual(validInput);
      expect(json.id).toBe(id);
      expect(json.budgetId).toBe(budgetId);
      expect(json.categoryId).toBe(categoryId);
      expect(json.description).toBe(description);
      expect(json.amount).toBe(amount);
      expect(json.expenseTarget.type).toBe(validInput.expenseTarget.type);
      expect(json.expenseTarget.data).toBe(validInput.expenseTarget.data);
    });
  });

  describe('fromJSON', () => {
    test('returns an Expense based on valid input', () => {
      const expense = Expense.fromJSON(validInput);

      expect(expense instanceof Expense).toBe(true);
      expect(expense.id).toBe(id);
      expect(expense.budgetId).toBe(budgetId);
      expect(expense.categoryId).toBe(categoryId);
      expect(expense.description).toBe(description);
      expect(expense.amount).toBe(amount);
      expect(expense.expenseTarget instanceof MonthlyExpenseTarget).toBe(true);
    });

    test('toJSON can piped directly into fromJSON', () => {
      const expense1 = Expense.fromJSON(validInput);
      const expense2 = Expense.fromJSON(expense1.toJSON());

      expect(expense1.toJSON()).toEqual(expense2.toJSON());
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      expect(() => Expense.fromJSON(invalidInput)).not.toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => Expense.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(() => Expense.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.categoryId;
      expect(() => Expense.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.description;
      expect(() => Expense.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.amount;
      expect(() => Expense.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.expenseTarget;
      expect(() => Expense.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if the input is not an object', () => {
      expect(() => Expense.fromJSON('invalidInput')).toThrow();
      expect(() => Expense.fromJSON(1)).toThrow();
      expect(() => Expense.fromJSON(true)).toThrow();
      expect(() => Expense.fromJSON([])).toThrow();
      expect(() => Expense.fromJSON(null)).toThrow();
    });
  });

  describe('expenseJSONTest', () => {
    test('returns an empty array for valid input', () => {
      const result = Expense.expenseJSONTest(validInput);
      expect(result).toEqual([]);
    });

    test('returns an array of strings for invalid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      expect(Expense.expenseJSONTest(invalidInput)).toEqual([]);

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(Expense.expenseJSONTest(invalidInput)).toEqual(['id']);

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(Expense.expenseJSONTest(invalidInput)).toEqual(['budgetId']);

      invalidInput = { ...validInput };
      delete invalidInput.categoryId;
      expect(Expense.expenseJSONTest(invalidInput)).toEqual(['categoryId']);

      invalidInput = { ...validInput };
      delete invalidInput.description;
      expect(Expense.expenseJSONTest(invalidInput)).toEqual(['description']);

      invalidInput = { ...validInput };
      delete invalidInput.amount;
      expect(Expense.expenseJSONTest(invalidInput)).toEqual(['amount']);

      invalidInput = { ...validInput };
      delete invalidInput.expenseTarget;
      expect(Expense.expenseJSONTest(invalidInput)).toEqual(['expenseTarget']);
    });

    test('returns root if the input is not an object', () => {
      expect(Expense.expenseJSONTest('invalidInput')).toEqual(['root']);
      expect(Expense.expenseJSONTest(1)).toEqual(['root']);
      expect(Expense.expenseJSONTest(true)).toEqual(['root']);
      expect(Expense.expenseJSONTest([])).toEqual(['root']);
      expect(Expense.expenseJSONTest(null)).toEqual(['root']);
    });
  });

  describe('isExpenseJSON', () => {
    test('returns true if the input is valid', () => {
      expect(Expense.isExpenseJSON(validInput)).toBe(true);
    });

    test('returns false if the input is invalid', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      expect(Expense.isExpenseJSON(invalidInput)).toBe(true);

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(Expense.isExpenseJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(Expense.isExpenseJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.categoryId;
      expect(Expense.isExpenseJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.description;
      expect(Expense.isExpenseJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.amount;
      expect(Expense.isExpenseJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.expenseTarget;
      expect(Expense.isExpenseJSON(invalidInput)).toBe(false);
    });

    test('returns false if the input is not an object', () => {
      expect(Expense.isExpenseJSON('invalidInput')).toBe(false);
      expect(Expense.isExpenseJSON(1)).toBe(false);
      expect(Expense.isExpenseJSON(true)).toBe(false);
      expect(Expense.isExpenseJSON([])).toBe(false);
      expect(Expense.isExpenseJSON(null)).toBe(false);
    });
  });
});
