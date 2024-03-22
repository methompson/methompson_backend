import { DepositConversion, DepositConversionJSON } from './action';

describe('DepositConversion', () => {
  const validInput: DepositConversionJSON = {
    id: 'id',
    vbUserId: 'vbUserId',
    name: 'name',
    conversionUnit: 'conversionUnit',
    depositsPer: 1,
    tokensPer: 2,
    minDeposit: 3,
  };

  describe('toJSON', () => {
    test('returns an expected value', () => {
      const depositConversion = DepositConversion.fromJSON(validInput);

      const result = depositConversion.toJSON();

      expect(result).toEqual(validInput);
    });
  });

  describe('fromJSON', () => {
    test('returns a new DepositConversion based on valid input', () => {
      const result = DepositConversion.fromJSON(validInput);
      expect(result instanceof DepositConversion).toBe(true);
      expect(result.id).toBe('id');
      expect(result.vbUserId).toBe('vbUserId');
      expect(result.name).toBe('name');
      expect(result.conversionUnit).toBe('conversionUnit');
      expect(result.depositsPer).toBe(1);
      expect(result.tokensPer).toBe(2);
      expect(result.minDeposit).toBe(3);
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => DepositConversion.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.vbUserId;
      expect(() => DepositConversion.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(() => DepositConversion.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.conversionUnit;
      expect(() => DepositConversion.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.depositsPer;
      expect(() => DepositConversion.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.tokensPer;
      expect(() => DepositConversion.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.minDeposit;
      expect(() => DepositConversion.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if the input is not an object', () => {
      expect(() => DepositConversion.fromJSON('invalidInput')).toThrow();
      expect(() => DepositConversion.fromJSON(1)).toThrow();
      expect(() => DepositConversion.fromJSON(true)).toThrow();
      expect(() => DepositConversion.fromJSON([])).toThrow();
      expect(() => DepositConversion.fromJSON(null)).toThrow();
    });
  });

  describe('isDepositConversionJSON', () => {
    test('returns true if the input is valid', () => {
      expect(DepositConversion.isDepositConversionJSON(validInput)).toBe(true);
    });

    test('returns false if the input is missing any value from a valid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(DepositConversion.isDepositConversionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      delete invalidInput.vbUserId;
      expect(DepositConversion.isDepositConversionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(DepositConversion.isDepositConversionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      delete invalidInput.conversionUnit;
      expect(DepositConversion.isDepositConversionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      delete invalidInput.depositsPer;
      expect(DepositConversion.isDepositConversionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      delete invalidInput.tokensPer;
      expect(DepositConversion.isDepositConversionJSON(invalidInput)).toBe(
        false,
      );

      invalidInput = { ...validInput };
      delete invalidInput.minDeposit;
      expect(DepositConversion.isDepositConversionJSON(invalidInput)).toBe(
        false,
      );
    });

    test('returns false if the input is not an object', () => {
      expect(DepositConversion.isDepositConversionJSON('invalidInput')).toBe(
        false,
      );
      expect(DepositConversion.isDepositConversionJSON(1)).toBe(false);
      expect(DepositConversion.isDepositConversionJSON(true)).toBe(false);
      expect(DepositConversion.isDepositConversionJSON([])).toBe(false);
      expect(DepositConversion.isDepositConversionJSON(null)).toBe(false);
    });
  });

  describe('DepositConversionJSONTest', () => {
    test('returns an empty array if the input is valid', () => {
      expect(DepositConversion.DepositConversionJSONTest(validInput)).toEqual(
        [],
      );
    });

    test('returns an array of strings if the input is missing any value from a valid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(DepositConversion.DepositConversionJSONTest(invalidInput)).toEqual(
        ['id'],
      );

      invalidInput = { ...validInput };
      delete invalidInput.vbUserId;
      expect(DepositConversion.DepositConversionJSONTest(invalidInput)).toEqual(
        ['vbUserId'],
      );

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(DepositConversion.DepositConversionJSONTest(invalidInput)).toEqual(
        ['name'],
      );

      invalidInput = { ...validInput };
      delete invalidInput.conversionUnit;
      expect(DepositConversion.DepositConversionJSONTest(invalidInput)).toEqual(
        ['conversionUnit'],
      );

      invalidInput = { ...validInput };
      delete invalidInput.depositsPer;
      expect(DepositConversion.DepositConversionJSONTest(invalidInput)).toEqual(
        ['depositsPer'],
      );

      invalidInput = { ...validInput };
      delete invalidInput.tokensPer;
      expect(DepositConversion.DepositConversionJSONTest(invalidInput)).toEqual(
        ['tokensPer'],
      );

      invalidInput = { ...validInput };
      delete invalidInput.minDeposit;
      expect(DepositConversion.DepositConversionJSONTest(invalidInput)).toEqual(
        ['minDeposit'],
      );
    });

    test('returns root if the input is not an object', () => {
      expect(
        DepositConversion.DepositConversionJSONTest('invalidInput'),
      ).toEqual(['root']);
      expect(DepositConversion.DepositConversionJSONTest(1)).toEqual(['root']);
      expect(DepositConversion.DepositConversionJSONTest(true)).toEqual([
        'root',
      ]);
      expect(DepositConversion.DepositConversionJSONTest([])).toEqual(['root']);
      expect(DepositConversion.DepositConversionJSONTest(null)).toEqual([
        'root',
      ]);
    });
  });

  describe('fromNewDepositConversion', () => {
    test('returns a new DepositConversion based on valid input', () => {
      const input = DepositConversion.fromJSON(validInput);
      const newId = 'newId';
      const result = DepositConversion.fromNewDepositConversion(newId, input);

      expect(result instanceof DepositConversion).toBe(true);
      expect(result.id).toBe(newId);
      expect(result.vbUserId).toBe(input.vbUserId);
      expect(result.name).toBe(input.name);
      expect(result.conversionUnit).toBe(input.conversionUnit);
      expect(result.depositsPer).toBe(input.depositsPer);
      expect(result.tokensPer).toBe(input.tokensPer);
      expect(result.minDeposit).toBe(input.minDeposit);
    });
  });
});
