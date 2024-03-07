import { PurchasePrice, PurchasePriceJSON } from './purchase_price';

describe('PurchasePrice', () => {
  const validInput: PurchasePriceJSON = {
    id: 'id',
    userId: 'userId',
    name: 'name',
    price: 1,
  };

  describe('toJSON', () => {
    test('returns an expected value', () => {
      const purchasePrice = PurchasePrice.fromJSON(validInput);

      const result = purchasePrice.toJSON();

      expect(result).toEqual(validInput);
    });
  });

  describe('fromJSON', () => {
    test('returns a new PurchasePrice based on valid input', () => {
      const result = PurchasePrice.fromJSON(validInput);
      expect(result instanceof PurchasePrice).toBe(true);
      expect(result.id).toBe('id');
      expect(result.userId).toBe('userId');
      expect(result.name).toBe('name');
      expect(result.price).toBe(1);
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => PurchasePrice.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.userId;
      expect(() => PurchasePrice.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(() => PurchasePrice.fromJSON(invalidInput)).toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.price;
      expect(() => PurchasePrice.fromJSON(invalidInput)).toThrow();
    });

    test('throws an error if the input is not an object', () => {
      expect(() => PurchasePrice.fromJSON('invalidInput')).toThrow();
      expect(() => PurchasePrice.fromJSON(1)).toThrow();
      expect(() => PurchasePrice.fromJSON(true)).toThrow();
      expect(() => PurchasePrice.fromJSON([])).toThrow();
      expect(() => PurchasePrice.fromJSON(null)).toThrow();
    });
  });

  describe('isPurchasePriceJSON', () => {
    test('returns true if the input is valid', () => {
      expect(PurchasePrice.isPurchasePriceJSON(validInput)).toBe(true);
    });

    test('returns false if the input is missing any value from a valid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(PurchasePrice.isPurchasePriceJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.userId;
      expect(PurchasePrice.isPurchasePriceJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(PurchasePrice.isPurchasePriceJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.price;
      expect(PurchasePrice.isPurchasePriceJSON(invalidInput)).toBe(false);
    });

    test('returns false if the input is not an object', () => {
      expect(PurchasePrice.isPurchasePriceJSON('invalidInput')).toBe(false);
      expect(PurchasePrice.isPurchasePriceJSON(1)).toBe(false);
      expect(PurchasePrice.isPurchasePriceJSON(true)).toBe(false);
      expect(PurchasePrice.isPurchasePriceJSON([])).toBe(false);
      expect(PurchasePrice.isPurchasePriceJSON(null)).toBe(false);
    });
  });

  describe('PurchasePriceJSONTest', () => {
    test('returns an empty array if the input is valid', () => {
      expect(PurchasePrice.PurchasePriceJSONTest(validInput)).toEqual([]);
    });

    test('returns an array of strings if the input is missing any value from a valid input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(PurchasePrice.PurchasePriceJSONTest(invalidInput)).toEqual(['id']);

      invalidInput = { ...validInput };
      delete invalidInput.userId;
      expect(PurchasePrice.PurchasePriceJSONTest(invalidInput)).toEqual([
        'userId',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(PurchasePrice.PurchasePriceJSONTest(invalidInput)).toEqual([
        'name',
      ]);

      invalidInput = { ...validInput };
      delete invalidInput.price;
      expect(PurchasePrice.PurchasePriceJSONTest(invalidInput)).toEqual([
        'price',
      ]);
    });

    test('returns root if the input is not an object', () => {
      expect(PurchasePrice.PurchasePriceJSONTest('invalidInput')).toEqual([
        'root',
      ]);
      expect(PurchasePrice.PurchasePriceJSONTest(1)).toEqual(['root']);
      expect(PurchasePrice.PurchasePriceJSONTest(true)).toEqual(['root']);
      expect(PurchasePrice.PurchasePriceJSONTest([])).toEqual(['root']);
      expect(PurchasePrice.PurchasePriceJSONTest(null)).toEqual(['root']);
    });
  });

  describe('fromNewPurchasePrice', () => {
    test('returns a new PurchasePrice based on valid input', () => {
      const input = PurchasePrice.fromJSON(validInput);
      const newId = 'newId';
      const result = PurchasePrice.fromNewPurchasePrice(newId, input);

      expect(result instanceof PurchasePrice).toBe(true);
      expect(result.id).toBe(newId);
      expect(result.userId).toBe(input.userId);
      expect(result.name).toBe(input.name);
      expect(result.price).toBe(input.price);
    });
  });
});
