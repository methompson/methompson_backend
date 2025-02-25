import { Category, CategoryJSON } from './category';

describe('Category', () => {
  const id = 'id';
  const budgetId = 'budgetId';
  const name = 'name';

  const validInput: CategoryJSON = {
    id,
    budgetId,
    name,
  };

  describe('toJSON', () => {
    test('returns a CategoryJSON object', () => {
      expect(new Category(id, budgetId, name).toJSON()).toEqual(validInput);
    });
  });

  describe('fromJSON', () => {
    test('returns a Category object', () => {
      const category = Category.fromJSON(validInput);
      expect(category).toBeInstanceOf(Category);
      expect(category.toJSON()).toEqual(validInput);
    });

    test('toJSON can be piped into fromJSON', () => {
      const category1 = Category.fromJSON(validInput);
      const category2 = Category.fromJSON(category1.toJSON());

      expect(category1.toJSON()).toEqual(category2.toJSON());
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(() => Category.fromJSON(invalidInput)).not.toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(() => Category.fromJSON(invalidInput)).toThrow('Invalid JSON id');

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(() => Category.fromJSON(invalidInput)).toThrow(
        'Invalid JSON budgetId',
      );

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(() => Category.fromJSON(invalidInput)).toThrow(
        'Invalid JSON name',
      );
    });

    test('throws an error when the input is not an object', () => {
      expect(() => Category.fromJSON('string')).toThrow();
      expect(() => Category.fromJSON(1)).toThrow();
      expect(() => Category.fromJSON(true)).toThrow();
      expect(() => Category.fromJSON([])).toThrow();
      expect(() => Category.fromJSON(null)).toThrow();
    });
  });

  describe('isCategoryJSON', () => {
    test('returns true if the input is a CategoryJSON object', () => {
      expect(Category.isCategoryJSON(validInput)).toBe(true);
    });

    test('returns false if the input is missing values', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };

      expect(Category.isCategoryJSON(invalidInput)).toBe(true);

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(Category.isCategoryJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(Category.isCategoryJSON(invalidInput)).toBe(false);

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(Category.isCategoryJSON(invalidInput)).toBe(false);
    });

    test('returns false if the input is not an object', () => {
      expect(Category.isCategoryJSON([])).toBe(false);
      expect(Category.isCategoryJSON('string')).toBe(false);
      expect(Category.isCategoryJSON(1)).toBe(false);
      expect(Category.isCategoryJSON(true)).toBe(false);
      expect(Category.isCategoryJSON(null)).toBe(false);
    });
  });

  describe('categoryJSONTest', () => {
    test('returns an empty array if the input is valid', () => {
      expect(Category.categoryJSONTest(validInput)).toEqual([]);
    });

    test('returns an array of strings if the input is invalid', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      expect(Category.categoryJSONTest(invalidInput)).toEqual([]);

      invalidInput = { ...validInput };
      delete invalidInput.id;
      expect(Category.categoryJSONTest(invalidInput)).toEqual(['id']);

      invalidInput = { ...validInput };
      delete invalidInput.budgetId;
      expect(Category.categoryJSONTest(invalidInput)).toEqual(['budgetId']);

      invalidInput = { ...validInput };
      delete invalidInput.name;
      expect(Category.categoryJSONTest(invalidInput)).toEqual(['name']);
    });

    test('returns an array with "root" if the input is not an object', () => {
      expect(Category.categoryJSONTest([])).toEqual(['root']);
      expect(Category.categoryJSONTest('string')).toEqual(['root']);
      expect(Category.categoryJSONTest(1)).toEqual(['root']);
      expect(Category.categoryJSONTest(true)).toEqual(['root']);
      expect(Category.categoryJSONTest(null)).toEqual(['root']);
    });
  });
});
