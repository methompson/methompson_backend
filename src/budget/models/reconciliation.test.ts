import { Reconciliation, ReconciliationJSON } from './reconciliation';

describe('Reconciliation', () => {
  const validInput: ReconciliationJSON = {
    id: 'id',
    budgetId: 'budgetId',
    date: '2024-01-01',
    balance: 200,
  };

  describe('toJSON', () => {
    test('exports expected data', () => {
      const reconciliation = Reconciliation.fromJSON(validInput);

      expect(reconciliation.toJSON()).toEqual(validInput);
    });
  });

  describe('fromJSON', () => {
    test('returns a Reconciliation object', () => {
      const reconciliation = Reconciliation.fromJSON(validInput);

      expect(reconciliation).toBeInstanceOf(Reconciliation);
      expect(reconciliation.toJSON()).toEqual(validInput);
    });

    test('toJSON can piped directly into fromJSON', () => {
      const reconciliation1 = Reconciliation.fromJSON(validInput);
      const reconciliation2 = Reconciliation.fromJSON(reconciliation1.toJSON());

      expect(reconciliation1.toJSON()).toEqual(reconciliation2.toJSON());
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(() => Reconciliation.fromJSON(invalidInput)).not.toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => Reconciliation.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(() => Reconciliation.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.date;
      expect(() => Reconciliation.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.balance;
      expect(() => Reconciliation.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if values are incorrect type in the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(() => Reconciliation.fromJSON(invalidInput)).not.toThrow();

      invalidInput = { ...validInput };
      invalidInput.id = 1;
      expect(() => Reconciliation.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.budgetId = 1;
      expect(() => Reconciliation.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.date = 1;
      expect(() => Reconciliation.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.balance = 'string';
      expect(() => Reconciliation.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if the input is not an object', () => {
      expect(() => Reconciliation.fromJSON('invalidInput')).toThrow();
      expect(() => Reconciliation.fromJSON(1)).toThrow();
      expect(() => Reconciliation.fromJSON([])).toThrow();
      expect(() => Reconciliation.fromJSON(false)).toThrow();
      expect(() => Reconciliation.fromJSON(null)).toThrow();
    });
  });

  describe('isReconciliationJSON', () => {
    test('returns true if the input is valid', () => {
      expect(Reconciliation.isReconciliationJSON(validInput)).toBe(true);
    });

    test('returns false if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(Reconciliation.isReconciliationJSON(invalidInput)).toBe(true);

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(Reconciliation.isReconciliationJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(Reconciliation.isReconciliationJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.date;
      expect(Reconciliation.isReconciliationJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.balance;
      expect(Reconciliation.isReconciliationJSON(invalidInput)).toBe(false);
    });

    test('returns false if values are incorrect type in the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(Reconciliation.isReconciliationJSON(invalidInput)).toBe(true);

      invalidInput = { ...validInput };
      invalidInput.id = 1;
      expect(Reconciliation.isReconciliationJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      invalidInput.budgetId = 1;
      expect(Reconciliation.isReconciliationJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      invalidInput.date = 1;
      expect(Reconciliation.isReconciliationJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      invalidInput.balance = 'string';
      expect(Reconciliation.isReconciliationJSON(invalidInput)).toBe(false);
    });

    test('returns false if the input is not an object', () => {
      expect(Reconciliation.isReconciliationJSON('invalidInput')).toBe(false);
      expect(Reconciliation.isReconciliationJSON(1)).toBe(false);
      expect(Reconciliation.isReconciliationJSON([])).toBe(false);
      expect(Reconciliation.isReconciliationJSON(false)).toBe(false);
      expect(Reconciliation.isReconciliationJSON(null)).toBe(false);
    });
  });

  describe('reconciliationJSONTest', () => {
    test('returns an empty array if the input is valid', () => {
      expect(Reconciliation.reconciliationJSONTest(validInput)).toEqual([]);
    });

    test('returns an empty array if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(Reconciliation.reconciliationJSONTest(invalidInput)).toEqual([]);

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(Reconciliation.reconciliationJSONTest(invalidInput)).toEqual([
        'id',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(Reconciliation.reconciliationJSONTest(invalidInput)).toEqual([
        'budgetId',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.date;
      expect(Reconciliation.reconciliationJSONTest(invalidInput)).toEqual([
        'date',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.balance;
      expect(Reconciliation.reconciliationJSONTest(invalidInput)).toEqual([
        'balance',
      ]);
    });

    test('returns an empty array if values are incorrect type in the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(Reconciliation.reconciliationJSONTest(invalidInput)).toEqual([]);

      invalidInput = { ...validInput };
      invalidInput.id = 1;
      expect(Reconciliation.reconciliationJSONTest(invalidInput)).toEqual([
        'id',
      ]);

      invalidInput = { ...validInput };
      invalidInput.budgetId = 1;
      expect(Reconciliation.reconciliationJSONTest(invalidInput)).toEqual([
        'budgetId',
      ]);

      invalidInput = { ...validInput };
      invalidInput.date = 1;
      expect(Reconciliation.reconciliationJSONTest(invalidInput)).toEqual([
        'date',
      ]);

      invalidInput = { ...validInput };
      invalidInput.balance = 'string';
      expect(Reconciliation.reconciliationJSONTest(invalidInput)).toEqual([
        'balance',
      ]);
    });

    test('returns an array with root if the input is not an object', () => {
      expect(Reconciliation.reconciliationJSONTest('invalidInput')).toEqual([
        'root',
      ]);
      expect(Reconciliation.reconciliationJSONTest(1)).toEqual(['root']);
      expect(Reconciliation.reconciliationJSONTest([])).toEqual(['root']);
      expect(Reconciliation.reconciliationJSONTest(false)).toEqual(['root']);
      expect(Reconciliation.reconciliationJSONTest(null)).toEqual(['root']);
    });
  });
});
