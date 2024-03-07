import { Deposit, DepositJSON } from './deposit';

describe('Deposit', () => {
  const validInput: DepositJSON = {
    id: 'id',
    userId: 'userId',
    date: '2023-02-25T00:00:00.000-06:00',
    depositQuantity: 1,
    conversionRate: 1,
    depositConversionName: 'depositConversionName',
  };

  describe('toJSON', () => {
    test('returns an expected value', () => {
      const deposit = Deposit.fromJSON(validInput);

      const result = deposit.toJSON();

      expect(result).toEqual(validInput);
    });
  });

  describe('fromJSON', () => {
    test('returns a new Deposit based on valid input', () => {
      const result = Deposit.fromJSON(validInput);
      expect(result instanceof Deposit).toBe(true);
      expect(result.id).toBe(validInput.id);
      expect(result.userId).toBe(validInput.userId);
      expect(result.date.toISO()).toBe(validInput.date);
      expect(result.depositQuantity).toBe(validInput.depositQuantity);
      expect(result.conversionRate).toBe(validInput.conversionRate);
      expect(result.depositConversionName).toBe(
        validInput.depositConversionName,
      );
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => Deposit.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.userId;
      expect(() => Deposit.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.date;
      expect(() => Deposit.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.depositQuantity;
      expect(() => Deposit.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.conversionRate;
      expect(() => Deposit.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.depositConversionName;
      expect(() => Deposit.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if the input is not an object', () => {
      expect(() => Deposit.fromJSON('invalidInput')).toThrow();
      expect(() => Deposit.fromJSON(1)).toThrow();
      expect(() => Deposit.fromJSON(true)).toThrow();
      expect(() => Deposit.fromJSON([])).toThrow();
      expect(() => Deposit.fromJSON(null)).toThrow();
    });
  });

  describe('isDepositJSON', () => {
    test('returns true if the input is valid', () => {
      expect(Deposit.isDepositJSON(validInput)).toBe(true);
    });

    test('returns false if the input is missing any value from a valid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(Deposit.isDepositJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.userId;
      expect(Deposit.isDepositJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.date;
      expect(Deposit.isDepositJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.depositQuantity;
      expect(Deposit.isDepositJSON(invalidInput)).toBe(false);
    });

    test('returns false if the input is not an object', () => {
      expect(Deposit.isDepositJSON('invalidInput')).toBe(false);
      expect(Deposit.isDepositJSON(1)).toBe(false);
      expect(Deposit.isDepositJSON(true)).toBe(false);
      expect(Deposit.isDepositJSON([])).toBe(false);
      expect(Deposit.isDepositJSON(null)).toBe(false);
    });
  });

  describe('DepositJSONTest', () => {
    test('returns an empty array if the input is valid', () => {
      expect(Deposit.DepositJSONTest(validInput)).toEqual([]);
    });

    test('returns an array of strings if the input is missing any value from a valid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(Deposit.DepositJSONTest(invalidInput)).toEqual(['id']);

      invalidInput = { ...validInput };
      delete invalidInput.userId;
      expect(Deposit.DepositJSONTest(invalidInput)).toEqual(['userId']);

      invalidInput = { ...validInput };
      delete invalidInput.date;
      expect(Deposit.DepositJSONTest(invalidInput)).toEqual(['date']);

      invalidInput = { ...validInput };
      delete invalidInput.depositQuantity;
      expect(Deposit.DepositJSONTest(invalidInput)).toEqual([
        'depositQuantity',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.conversionRate;
      expect(Deposit.DepositJSONTest(invalidInput)).toEqual(['conversionRate']);

      invalidInput = { ...validInput };
      delete invalidInput.depositConversionName;
      expect(Deposit.DepositJSONTest(invalidInput)).toEqual([
        'depositConversionName',
      ]);
    });

    test('returns root if the input is not an object', () => {
      expect(Deposit.DepositJSONTest('invalidInput')).toEqual(['root']);
      expect(Deposit.DepositJSONTest(1)).toEqual(['root']);
      expect(Deposit.DepositJSONTest(true)).toEqual(['root']);
      expect(Deposit.DepositJSONTest([])).toEqual(['root']);
      expect(Deposit.DepositJSONTest(null)).toEqual(['root']);
    });
  });

  describe('fromNewDeposit', () => {
    test('returns a new Deposit based on valid input', () => {
      const depositInput = Deposit.fromJSON(validInput);
      const newId = 'newId';
      const result = Deposit.fromNewDeposit(newId, depositInput);

      expect(result instanceof Deposit).toBe(true);
      expect(result.id).toBe(newId);
      expect(result.userId).toBe(depositInput.userId);
      expect(result.date.toISO()).toBe(depositInput.date.toISO());
      expect(result.depositQuantity).toBe(depositInput.depositQuantity);
      expect(result.conversionRate).toBe(depositInput.conversionRate);
      expect(result.depositConversionName).toBe(
        depositInput.depositConversionName,
      );
    });
  });
});
