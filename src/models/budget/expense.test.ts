describe.skip('Expense', () => {
  describe('toJSON', () => {
    test('exports expected data', () => {});
  });

  describe('fromJSON', () => {
    test('returns an Expense based on valid input', () => {});
    test('toJSON can piped directly into fromJSON', () => {});
    test('throws an error if values are missing from the input', () => {});
    test('throws an error if the input is not an object', () => {});
  });

  describe('expenseJSONTest', () => {
    test('returns an empty array for valid input', () => {});
    test('returns an array of strings for invalid input', () => {});
    test('returns root if the input is not an object', () => {});
  });

  describe('isExpenseJSON', () => {
    test('returns true if the input is valid', () => {});
    test('returns false if the input is invalid', () => {});
    test('returns false if the input is not an object', () => {});
  });
});
