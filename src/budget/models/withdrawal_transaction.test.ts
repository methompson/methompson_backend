import {
  WithdrawalTransaction,
  WithdrawalTransactionJSON,
} from './withdrawal_transaction';

describe('WithdrawalTransaction', () => {
  const validInput: WithdrawalTransactionJSON = {
    id: 'id',
    budgetId: 'budgetId',
    expenseId: 'expenseId',
    description: 'description',
    dateTime: '2021-02-01T12:30:00.000-06:00',
    amount: 1,
  };

  describe('toJSON', () => {
    test('returns the correct JSON', () => {
      const withdrawalTransaction = WithdrawalTransaction.fromJSON(validInput);

      expect(withdrawalTransaction.toJSON()).toEqual(validInput);
    });
  });

  describe('fromJSON', () => {
    test('returns a WithdrawalTransaction object', () => {
      const withdrawalTransaction = WithdrawalTransaction.fromJSON(validInput);

      expect(withdrawalTransaction).toBeInstanceOf(WithdrawalTransaction);
      expect(withdrawalTransaction.toJSON()).toEqual(validInput);
    });

    test('toJSON can be piped into fromJSON', () => {
      const withdrawalTransaction1 = WithdrawalTransaction.fromJSON(validInput);
      const withdrawalTransaction2 = WithdrawalTransaction.fromJSON(
        withdrawalTransaction1.toJSON(),
      );

      expect(withdrawalTransaction1.toJSON()).toEqual(
        withdrawalTransaction2.toJSON(),
      );
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).not.toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.expenseId;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.description;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.dateTime;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.amount;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if values are incorrect type in the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).not.toThrow();

      invalidInput = { ...validInput };
      invalidInput.id = 1;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.budgetId = 1;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.expenseId = 1;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.description = 1;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.dateTime = 1;
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      invalidInput.amount = '1';
      expect(() => WithdrawalTransaction.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if the input is not an object', () => {
      expect(() => WithdrawalTransaction.fromJSON('string')).toThrow();
      expect(() => WithdrawalTransaction.fromJSON(1)).toThrow();
      expect(() => WithdrawalTransaction.fromJSON(true)).toThrow();
      expect(() => WithdrawalTransaction.fromJSON([])).toThrow();
      expect(() => WithdrawalTransaction.fromJSON(null)).toThrow();
    });
  });

  describe('isWithdrawalTransactionJSON', () => {
    test('returns true if the input is valid', () => {
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(validInput),
      ).toBe(true);
    });

    test('returns false if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(true);

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.expenseId;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.description;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.dateTime;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.amount;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);
    });

    test('returns false if values are incorrect type in the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(true);

      invalidInput = { ...validInput };
      invalidInput.id = 1;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);

      invalidInput = { ...validInput };
      invalidInput.budgetId = 1;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);

      invalidInput = { ...validInput };
      invalidInput.expenseId = 1;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);

      invalidInput = { ...validInput };
      invalidInput.description = 1;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);

      invalidInput = { ...validInput };
      invalidInput.dateTime = 1;
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);

      invalidInput = { ...validInput };
      invalidInput.amount = '1';
      expect(
        WithdrawalTransaction.isWithdrawalTransactionJSON(invalidInput),
      ).toBe(false);
    });

    test('returns false if the input is not an object', () => {
      expect(WithdrawalTransaction.isWithdrawalTransactionJSON('string')).toBe(
        false,
      );
      expect(WithdrawalTransaction.isWithdrawalTransactionJSON(1)).toBe(false);
      expect(WithdrawalTransaction.isWithdrawalTransactionJSON([])).toBe(false);
      expect(WithdrawalTransaction.isWithdrawalTransactionJSON(false)).toBe(
        false,
      );
      expect(WithdrawalTransaction.isWithdrawalTransactionJSON(null)).toBe(
        false,
      );
    });
  });

  describe('withdrawalTransactionTest', () => {
    test('returns an empty array if the input is valid', () => {
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(validInput),
      ).toEqual([]);
    });

    test('returns an empty array if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual([]);

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['id']);

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['budgetId']);

      invalidInput = { ...validInput };
      delete invalidInput.expenseId;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['expenseId']);

      invalidInput = { ...validInput };
      delete invalidInput.description;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['description']);

      invalidInput = { ...validInput };
      delete invalidInput.dateTime;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['date']);

      invalidInput = { ...validInput };
      delete invalidInput.amount;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['amount']);
    });

    test('returns an empty array if values are incorrect type in the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual([]);

      invalidInput = { ...validInput };
      invalidInput.id = 1;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['id']);

      invalidInput = { ...validInput };
      invalidInput.budgetId = 1;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['budgetId']);

      invalidInput = { ...validInput };
      invalidInput.expenseId = 1;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['expenseId']);

      invalidInput = { ...validInput };
      invalidInput.description = 1;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['description']);

      invalidInput = { ...validInput };
      invalidInput.dateTime = 1;
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['date']);

      invalidInput = { ...validInput };
      invalidInput.amount = '1';
      expect(
        WithdrawalTransaction.withdrawalTransactionTest(invalidInput),
      ).toEqual(['amount']);
    });

    test('returns an array with root if the input is not an object', () => {
      expect(WithdrawalTransaction.withdrawalTransactionTest('string')).toEqual(
        ['root'],
      );
      expect(WithdrawalTransaction.withdrawalTransactionTest(1)).toEqual([
        'root',
      ]);
      expect(WithdrawalTransaction.withdrawalTransactionTest(true)).toEqual([
        'root',
      ]);
      expect(WithdrawalTransaction.withdrawalTransactionTest([])).toEqual([
        'root',
      ]);
      expect(WithdrawalTransaction.withdrawalTransactionTest(null)).toEqual([
        'root',
      ]);
    });
  });
});
