import {
  ExpenseTargetJSON,
  ExpenseTargetType,
  MonthlyExpenseTarget,
  MonthlyExpenseTargetJSON,
  WeeklyExpenseTarget,
  WeeklyExpenseTargetJSON,
} from './expense_target';

describe.skip('ExpenseTargetType', () => {
  describe('expenseTargetTypeFromString', () => {
    test('returns an appropriate ExpenseTargetType based on valid input', () => {});

    test('throws an error if the input is invalid', () => {});
  });

  describe('isExpenseTargetType', () => {
    test('returns true if the input is valid', () => {});
    test('returns false if the input is invalid', () => {});
    test('returns false if the input is not an object', () => {});
  });
});

describe.skip('ExpenseTarget', () => {
  describe('toJSON', () => {
    test('exports expected data', () => {});
  });

  describe('fromJSON', () => {
    test('returns an ExpenseTarget based on valid input', () => {});
    test('toJSON can piped directly into fromJSON', () => {});
    test('throws an error if values are missing from the input', () => {});
    test('throws an error if the input is not an object', () => {});
  });

  describe('expenseTargetJSONTest', () => {
    test('returns an empty array for valid input', () => {});
    test('returns an array of strings for invalid input', () => {});
    test('returns root if the input is not an object', () => {});
  });

  describe('isExpenseTargetJSON', () => {
    test('returns true if the input is valid', () => {});
    test('returns false if the input is invalid', () => {});
    test('returns false if the input is not an object', () => {});
  });
});

describe('WeeklyExpenseTarget', () => {
  const validInput: WeeklyExpenseTargetJSON = {
    dayOfWeek: 0,
  };

  const expenseTargetInput: ExpenseTargetJSON = {
    type: ExpenseTargetType.Weekly,
    data: JSON.stringify(validInput),
  };

  describe('toJSON', () => {
    test('exports expected data', () => {
      const vi = new WeeklyExpenseTarget(validInput.dayOfWeek);

      expect(vi.toJSON()).toEqual({
        type: 'weekly',
        data: JSON.stringify(vi.dataJSON()),
      });
    });
  });

  describe('fromJSON', () => {
    test('returns an WeeklyExpenseTarget based on valid input', () => {
      const result = WeeklyExpenseTarget.fromJSON(expenseTargetInput);

      expect(result.dataJSON()).toEqual(validInput);
    });

    test('toJSON can piped directly into fromJSON', () => {
      const result1 = WeeklyExpenseTarget.fromJSON(expenseTargetInput);
      const result2 = WeeklyExpenseTarget.fromJSON(result1.toJSON());

      expect(result1.toJSON()).toEqual(result2.toJSON());
      expect(result1.dataJSON()).toEqual(result2.dataJSON());
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      let json: Record<string, unknown> = {};

      json = {
        type: ExpenseTargetType.Weekly,
        data: JSON.stringify(validInput),
      };
      expect(() => WeeklyExpenseTarget.fromJSON(json)).not.toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.dayOfWeek;
      json = {
        type: ExpenseTargetType.Weekly,
        data: JSON.stringify(invalidInput),
      };
      expect(() => WeeklyExpenseTarget.fromJSON(json)).toThrow();

      json = {
        type: ExpenseTargetType.Weekly,
      };
      expect(() => WeeklyExpenseTarget.fromJSON(json)).toThrow();

      json = {
        data: JSON.stringify(validInput),
      };
      expect(() => WeeklyExpenseTarget.fromJSON(json)).toThrow();
    });

    test('throws an error if the input is not an object', () => {
      expect(() => WeeklyExpenseTarget.fromJSON([])).toThrow();
      expect(() => WeeklyExpenseTarget.fromJSON(1)).toThrow();
      expect(() => WeeklyExpenseTarget.fromJSON('')).toThrow();
      expect(() => WeeklyExpenseTarget.fromJSON(true)).toThrow();
      expect(() => WeeklyExpenseTarget.fromJSON(null)).toThrow();
    });
  });

  describe('weeklyExpenseTargetJSONTest', () => {
    test('returns an empty array for valid input', () => {});

    test('returns an array of strings for invalid input', () => {});

    test('returns root if the input is not an object', () => {});
  });

  describe('isWeeklyExpenseTargetJSON', () => {
    test('returns true if the input is valid', () => {});
    test('returns false if the input is invalid', () => {});
    test('returns false if the input is not an object', () => {});
  });
});

describe('MonthlyExpenseTarget', () => {
  const validInput: MonthlyExpenseTargetJSON = {
    dayOfMonth: 0,
  };

  const expenseTargetInput: ExpenseTargetJSON = {
    type: ExpenseTargetType.Monthly,
    data: JSON.stringify(validInput),
  };

  describe('toJSON', () => {
    test('exports expected data', () => {
      const vi = new MonthlyExpenseTarget(validInput.dayOfMonth);

      expect(vi.toJSON()).toEqual({
        type: 'monthly',
        data: JSON.stringify(vi.dataJSON()),
      });
    });
  });

  describe('fromJSON', () => {
    test('returns an MonthlyExpenseTarget based on valid input', () => {
      const result = MonthlyExpenseTarget.fromJSON(expenseTargetInput);

      expect(result.dataJSON()).toEqual(validInput);
    });

    test('toJSON can piped directly into fromJSON', () => {
      const result1 = MonthlyExpenseTarget.fromJSON(expenseTargetInput);
      const result2 = MonthlyExpenseTarget.fromJSON(result1.toJSON());

      expect(result1.toJSON()).toEqual(result2.toJSON());
      expect(result1.dataJSON()).toEqual(result2.dataJSON());
    });

    test('throws an error if values are missing from the input', () => {
      let invalidInput: Record<string, unknown> = { ...validInput };
      let json: Record<string, unknown> = {};

      json = {
        type: ExpenseTargetType.Monthly,
        data: JSON.stringify(validInput),
      };
      expect(() => MonthlyExpenseTarget.fromJSON(json)).not.toThrow();

      invalidInput = { ...validInput };
      delete invalidInput.dayOfMonth;
      json = {
        type: ExpenseTargetType.Monthly,
        data: JSON.stringify(invalidInput),
      };
      expect(() => MonthlyExpenseTarget.fromJSON(json)).toThrow();

      json = {
        data: JSON.stringify(validInput),
      };
      expect(() => MonthlyExpenseTarget.fromJSON(json)).toThrow();

      json = {
        type: ExpenseTargetType.Monthly,
      };
      expect(() => MonthlyExpenseTarget.fromJSON(json)).toThrow();
    });

    test('throws an error if the input is not an object', () => {
      expect(() => MonthlyExpenseTarget.fromJSON([])).toThrow();
      expect(() => MonthlyExpenseTarget.fromJSON(1)).toThrow();
      expect(() => MonthlyExpenseTarget.fromJSON('')).toThrow();
      expect(() => MonthlyExpenseTarget.fromJSON(true)).toThrow();
      expect(() => MonthlyExpenseTarget.fromJSON(null)).toThrow();
    });
  });

  describe('monthlyExpenseTargetJSONTest', () => {
    test('returns an empty array for valid input', () => {});
    test('returns an array of strings for invalid input', () => {});
    test('returns root if the input is not an object', () => {});
  });

  describe('isExpenseTargetJSON', () => {
    test('returns true if the input is valid', () => {});
    test('returns false if the input is invalid', () => {});
    test('returns false if the input is not an object', () => {});
  });
});

describe.skip('DatedExpenseTarget', () => {
  describe('toJSON', () => {
    test('exports expected data', () => {});
  });

  describe('fromJSON', () => {
    test('returns an DatedExpenseTarget based on valid input', () => {});
    test('toJSON can piped directly into fromJSON', () => {});
    test('throws an error if values are missing from the input', () => {});
    test('throws an error if the input is not an object', () => {});
  });

  describe('datedExpenseTargetJSONTest', () => {
    test('returns an empty array for valid input', () => {});
    test('returns an array of strings for invalid input', () => {});
    test('returns root if the input is not an object', () => {});
  });

  describe('isExpenseTargetJSON', () => {
    test('returns true if the input is valid', () => {});
    test('returns false if the input is invalid', () => {});
    test('returns false if the input is not an object', () => {});
  });
});
