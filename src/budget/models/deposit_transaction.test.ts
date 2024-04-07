import {
  DepositTransaction,
  DepositTransactionJSON,
} from './deposit_transaction';

describe('DepositTransaction', () => {
  const validInput: DepositTransactionJSON = {
    id: 'id',
    budgetId: 'budgetId',
    description: 'description',
    dateTime: '2021-02-01T12:30:00.000-06:00',
    amount: 1,
  };

  describe('toJSON', () => {
    test('returns the correct JSON', () => {
      const depositTransaction = DepositTransaction.fromJSON(validInput);

      expect(depositTransaction.toJSON()).toEqual(validInput);
    });
  });

  describe('fromJSON', () => {
    test('returns a DepositTransaction object', () => {
      const depositTransaction = DepositTransaction.fromJSON(validInput);

      expect(depositTransaction).toBeInstanceOf(DepositTransaction);
      expect(depositTransaction.toJSON()).toEqual(validInput);
    });

    test('toJSON can be piped into fromJSON', () => {
      const depositTransaction1 = DepositTransaction.fromJSON(validInput);
      const depositTransaction2 = DepositTransaction.fromJSON(
        depositTransaction1.toJSON(),
      );

      expect(depositTransaction1.toJSON()).toEqual(
        depositTransaction2.toJSON(),
      );
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(() => DepositTransaction.fromJSON(invalidInput)).not.toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => DepositTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(() => DepositTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.description;
      expect(() => DepositTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.dateTime;
      expect(() => DepositTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.amount;
      expect(() => DepositTransaction.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if values are incorrect type in the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(() => DepositTransaction.fromJSON(invalidInput)).not.toThrow();

      invalidInput = { ...validInput };
      invalidInput.id = 1;
      expect(() => DepositTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.budgetId = 1;
      expect(() => DepositTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.dateTime = 1;
      expect(() => DepositTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.amount = '1';
      expect(() => DepositTransaction.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error when the input is not an object', () => {
      expect(() => DepositTransaction.fromJSON('string')).toThrow();
      expect(() => DepositTransaction.fromJSON(1)).toThrow();
      expect(() => DepositTransaction.fromJSON(true)).toThrow();
      expect(() => DepositTransaction.fromJSON([])).toThrow();
      expect(() => DepositTransaction.fromJSON(null)).toThrow();
    });
  });

  describe('isDepositTransactionJSON', () => {
    test('returns true if the input is valid', () => {
      expect(DepositTransaction.isDepositTransactionJSON(validInput)).toBe(
        true,
      );
    });

    test('returns false if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        true,
      );

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      delete invalidInput.description;
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      delete invalidInput.dateTime;
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      delete invalidInput.amount;
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        false,
      );
    });

    test('returns false if values are incorrect type in the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        true,
      );

      invalidInput = { ...validInput };
      invalidInput.id = 1;
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      invalidInput.budgetId = 1;
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      invalidInput.dateTime = 1;
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      invalidInput.amount = '1';
      expect(DepositTransaction.isDepositTransactionJSON(invalidInput)).toBe(
        false,
      );
    });

    test('returns false when the input is not an object', () => {
      expect(DepositTransaction.isDepositTransactionJSON('string')).toBe(false);
      expect(DepositTransaction.isDepositTransactionJSON(1)).toBe(false);
      expect(DepositTransaction.isDepositTransactionJSON(true)).toBe(false);
      expect(DepositTransaction.isDepositTransactionJSON([])).toBe(false);
      expect(DepositTransaction.isDepositTransactionJSON(null)).toBe(false);
    });
  });

  describe('depositTransactionTest', () => {
    test('returns an empty array if the input is invalid', () => {
      expect(DepositTransaction.depositTransactionTest(validInput)).toEqual([]);
    });

    test('returns an array of strings if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual(
        [],
      );

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual([
        'id',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual([
        'budgetId',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.description;
      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual([
        'description',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.dateTime;
      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual([
        'date',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.amount;
      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual([
        'amount',
      ]);
    });

    test('returns an array of strings if values are incorrect type', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual(
        [],
      );

      invalidInput = { ...validInput };
      invalidInput.id = 1;
      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual([
        'id',
      ]);

      invalidInput = { ...validInput };
      invalidInput.budgetId = 1;
      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual([
        'budgetId',
      ]);

      invalidInput = { ...validInput };
      invalidInput.dateTime = 1;
      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual([
        'date',
      ]);

      invalidInput = { ...validInput };
      invalidInput.amount = '1';
      expect(DepositTransaction.depositTransactionTest(invalidInput)).toEqual([
        'amount',
      ]);
    });

    test('returns an array with root if the input is not an object', () => {
      expect(DepositTransaction.depositTransactionTest('string')).toEqual([
        'root',
      ]);
      expect(DepositTransaction.depositTransactionTest(1)).toEqual(['root']);
      expect(DepositTransaction.depositTransactionTest(true)).toEqual(['root']);
      expect(DepositTransaction.depositTransactionTest([])).toEqual(['root']);
      expect(DepositTransaction.depositTransactionTest(null)).toEqual(['root']);
    });
  });
});
