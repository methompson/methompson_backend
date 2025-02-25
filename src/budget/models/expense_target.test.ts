import {
  DatedExpenseTarget,
  DatedExpenseTargetJSON,
  ExpenseTarget,
  ExpenseTargetJSON,
  ExpenseTargetType,
  MonthlyExpenseTarget,
  MonthlyExpenseTargetJSON,
  WeeklyExpenseTarget,
  WeeklyExpenseTargetJSON,
  expenseTargetTypeFromString,
  isExpenseTargetType,
} from './expense_target';

describe('ExpenseTarget functions', () => {
  describe('ExpenseTargetType', () => {
    describe('expenseTargetTypeFromString', () => {
      test('returns an appropriate ExpenseTargetType based on valid input', () => {
        expect(expenseTargetTypeFromString('weekly')).toBe(
          ExpenseTargetType.Weekly,
        );
        expect(expenseTargetTypeFromString('monthly')).toBe(
          ExpenseTargetType.Monthly,
        );
        expect(expenseTargetTypeFromString('dated')).toBe(
          ExpenseTargetType.Dated,
        );
      });

      test('throws an error if the input is invalid', () => {
        expect(() => expenseTargetTypeFromString('invalid')).toThrow();
      });
    });

    describe('isExpenseTargetType', () => {
      test('returns true if the input is valid', () => {
        expect(isExpenseTargetType('weekly')).toBe(true);
        expect(isExpenseTargetType('monthly')).toBe(true);
        expect(isExpenseTargetType('dated')).toBe(true);
      });

      test('returns false if the input is invalid', () => {
        expect(isExpenseTargetType('invalid')).toBe(false);
      });

      test('returns false if the input is not a string', () => {
        expect(isExpenseTargetType(1)).toBe(false);
        expect(isExpenseTargetType([])).toBe(false);
        expect(isExpenseTargetType({})).toBe(false);
        expect(isExpenseTargetType(true)).toBe(false);
        expect(isExpenseTargetType(null)).toBe(false);
      });
    });
  });

  describe('ExpenseTarget', () => {
    const wet = new WeeklyExpenseTarget(0);
    const met = new MonthlyExpenseTarget(1);
    const det = DatedExpenseTarget.fromJSON({
      type: ExpenseTargetType.Dated,
      data: {
        date: '2024-05-01',
      },
    });

    describe('fromJSON', () => {
      test('returns an ExpenseTarget based on valid input', () => {
        const result1 = ExpenseTarget.fromJSON(wet.toJSON());
        expect(result1 instanceof WeeklyExpenseTarget).toBe(true);

        const result2 = ExpenseTarget.fromJSON(met.toJSON());
        expect(result2 instanceof MonthlyExpenseTarget).toBe(true);

        const result3 = ExpenseTarget.fromJSON(det.toJSON());
        expect(result3 instanceof DatedExpenseTarget).toBe(true);
      });

      test('throws an error if the type is not a valid ExpenseTargetType', () => {
        const invalidInput = { ...wet.toJSON() };
        invalidInput.type = 'invalid';
        expect(() => ExpenseTarget.fromJSON(invalidInput)).toThrow();
      });

      test('throws an error if values are missing from the input', () => {
        let invalidInput: Record<string, unknown> = { ...wet.toJSON() };
        expect(() => ExpenseTarget.fromJSON(invalidInput)).not.toThrow();

        invalidInput = { ...wet.toJSON() };
        delete invalidInput.type;
        expect(() => ExpenseTarget.fromJSON(invalidInput)).toThrow();

        invalidInput = { ...wet.toJSON() };
        delete invalidInput.data;
        expect(() => ExpenseTarget.fromJSON(invalidInput)).toThrow();
      });

      test('throws an error if the input is not an object', () => {
        expect(() => ExpenseTarget.fromJSON([])).toThrow();
        expect(() => ExpenseTarget.fromJSON(1)).toThrow();
        expect(() => ExpenseTarget.fromJSON('')).toThrow();
        expect(() => ExpenseTarget.fromJSON(true)).toThrow();
        expect(() => ExpenseTarget.fromJSON(null)).toThrow();
      });
    });

    describe('expenseTargetJSONTest', () => {
      const validInput = { ...wet.toJSON() };
      test('returns an empty array for valid input', () => {
        expect(ExpenseTarget.expenseTargetJSONTest(validInput)).toEqual([]);
      });

      test('returns an array of strings for invalid input', () => {
        let invalidInput: Record<string, unknown> = { ...validInput };
        expect(ExpenseTarget.expenseTargetJSONTest(invalidInput)).toEqual([]);

        invalidInput = { ...validInput };
        delete invalidInput.type;
        expect(ExpenseTarget.expenseTargetJSONTest(invalidInput)).toEqual([
          'type',
        ]);

        invalidInput = { ...validInput };
        delete invalidInput.data;
        expect(ExpenseTarget.expenseTargetJSONTest(invalidInput)).toEqual([
          'data',
        ]);

        invalidInput = { ...validInput };
        delete invalidInput.type;
        delete invalidInput.data;
        expect(ExpenseTarget.expenseTargetJSONTest(invalidInput)).toEqual([
          'type',
          'data',
        ]);
      });

      test('returns root if the input is not an object', () => {
        expect(ExpenseTarget.expenseTargetJSONTest([])).toEqual(['root']);
        expect(ExpenseTarget.expenseTargetJSONTest(1)).toEqual(['root']);
        expect(ExpenseTarget.expenseTargetJSONTest('')).toEqual(['root']);
        expect(ExpenseTarget.expenseTargetJSONTest(true)).toEqual(['root']);
        expect(ExpenseTarget.expenseTargetJSONTest(null)).toEqual(['root']);
      });
    });

    describe('isExpenseTargetJSON', () => {
      const validInput = { ...wet.toJSON() };

      test('returns true if the input is valid', () => {
        expect(ExpenseTarget.isExpenseTargetJSON(validInput)).toBe(true);
      });

      test('returns false if the input is invalid', () => {
        let invalidInput: Record<string, unknown> = { ...validInput };
        expect(ExpenseTarget.isExpenseTargetJSON(invalidInput)).toBe(true);

        invalidInput = { ...validInput };
        delete invalidInput.type;
        expect(ExpenseTarget.isExpenseTargetJSON(invalidInput)).toBe(false);

        invalidInput = { ...validInput };
        delete invalidInput.data;
        expect(ExpenseTarget.isExpenseTargetJSON(invalidInput)).toBe(false);
      });

      test('returns false if the input is not an object', () => {
        expect(ExpenseTarget.isExpenseTargetJSON([])).toBe(false);
        expect(ExpenseTarget.isExpenseTargetJSON(1)).toBe(false);
        expect(ExpenseTarget.isExpenseTargetJSON('')).toBe(false);
        expect(ExpenseTarget.isExpenseTargetJSON(true)).toBe(false);
        expect(ExpenseTarget.isExpenseTargetJSON(null)).toBe(false);
      });
    });
  });

  describe('WeeklyExpenseTarget', () => {
    const validInput: WeeklyExpenseTargetJSON = {
      dayOfWeek: 0,
    };

    const expenseTargetInput: ExpenseTargetJSON = {
      type: ExpenseTargetType.Weekly,
      data: { ...validInput },
    };

    describe('toJSON', () => {
      test('exports expected data', () => {
        const vi = new WeeklyExpenseTarget(validInput.dayOfWeek);

        expect(vi.toJSON()).toEqual({
          type: ExpenseTargetType.Weekly,
          data: vi.dataJSON(),
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
          data: validInput,
        };
        expect(() => WeeklyExpenseTarget.fromJSON(json)).not.toThrow();

        invalidInput = { ...validInput };
        delete invalidInput.dayOfWeek;
        json = {
          type: ExpenseTargetType.Weekly,
          data: invalidInput,
        };
        expect(() => WeeklyExpenseTarget.fromJSON(json)).toThrow();

        json = {
          type: ExpenseTargetType.Weekly,
        };
        expect(() => WeeklyExpenseTarget.fromJSON(json)).toThrow();

        json = {
          data: validInput,
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
      test('returns an empty array for valid input', () => {
        expect(
          WeeklyExpenseTarget.weeklyExpenseTargetJSONTest(validInput),
        ).toEqual([]);
      });

      test('returns an array of strings for invalid input', () => {
        let invalidInput: Record<string, unknown> = { ...validInput };

        invalidInput = { ...validInput };
        delete invalidInput.dayOfWeek;
        expect(
          WeeklyExpenseTarget.weeklyExpenseTargetJSONTest(invalidInput),
        ).toEqual(['dayOfWeek']);
      });

      test('returns root if the input is not an object', () => {
        expect(WeeklyExpenseTarget.weeklyExpenseTargetJSONTest([])).toEqual([
          'root',
        ]);
        expect(WeeklyExpenseTarget.weeklyExpenseTargetJSONTest(1)).toEqual([
          'root',
        ]);
        expect(WeeklyExpenseTarget.weeklyExpenseTargetJSONTest('')).toEqual([
          'root',
        ]);
        expect(WeeklyExpenseTarget.weeklyExpenseTargetJSONTest(true)).toEqual([
          'root',
        ]);
        expect(WeeklyExpenseTarget.weeklyExpenseTargetJSONTest(null)).toEqual([
          'root',
        ]);
      });
    });

    describe('isWeeklyExpenseTargetJSON', () => {
      test('returns true if the input is valid', () => {
        expect(WeeklyExpenseTarget.isWeeklyExpenseTargetJSON(validInput)).toBe(
          true,
        );
      });

      test('returns false if the input is invalid', () => {
        let invalidInput: Record<string, unknown> = { ...validInput };

        invalidInput = { ...validInput };
        delete invalidInput.dayOfWeek;
        expect(
          WeeklyExpenseTarget.isWeeklyExpenseTargetJSON(invalidInput),
        ).toBe(false);
      });

      test('returns false if the input is not an object', () => {
        expect(WeeklyExpenseTarget.isWeeklyExpenseTargetJSON([])).toBe(false);
        expect(WeeklyExpenseTarget.isWeeklyExpenseTargetJSON(1)).toBe(false);
        expect(WeeklyExpenseTarget.isWeeklyExpenseTargetJSON('')).toBe(false);
        expect(WeeklyExpenseTarget.isWeeklyExpenseTargetJSON(true)).toBe(false);
        expect(WeeklyExpenseTarget.isWeeklyExpenseTargetJSON(null)).toBe(false);
      });
    });
  });

  describe('MonthlyExpenseTarget', () => {
    const validInput: MonthlyExpenseTargetJSON = {
      dayOfMonth: 0,
    };

    const expenseTargetInput: ExpenseTargetJSON = {
      type: ExpenseTargetType.Monthly,
      data: { ...validInput },
    };

    describe('toJSON', () => {
      test('exports expected data', () => {
        const vi = new MonthlyExpenseTarget(validInput.dayOfMonth);

        expect(vi.toJSON()).toEqual({
          type: 'monthly',
          data: vi.dataJSON(),
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
          data: validInput,
        };
        expect(() => MonthlyExpenseTarget.fromJSON(json)).not.toThrow();

        invalidInput = { ...validInput };
        delete invalidInput.dayOfMonth;
        json = {
          type: ExpenseTargetType.Monthly,
          data: invalidInput,
        };
        expect(() => MonthlyExpenseTarget.fromJSON(json)).toThrow();

        json = {
          data: validInput,
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
      test('returns an empty array for valid input', () => {
        expect(
          MonthlyExpenseTarget.monthlyExpenseTargetJSONTest(validInput),
        ).toEqual([]);
      });

      test('returns an array of strings for invalid input', () => {
        let invalidInput: Record<string, unknown> = { ...validInput };

        invalidInput = { ...validInput };
        delete invalidInput.dayOfMonth;
        expect(
          MonthlyExpenseTarget.monthlyExpenseTargetJSONTest(invalidInput),
        ).toEqual(['dayOfMonth']);
      });

      test('returns root if the input is not an object', () => {
        expect(MonthlyExpenseTarget.monthlyExpenseTargetJSONTest([])).toEqual([
          'root',
        ]);
        expect(MonthlyExpenseTarget.monthlyExpenseTargetJSONTest(1)).toEqual([
          'root',
        ]);
        expect(MonthlyExpenseTarget.monthlyExpenseTargetJSONTest('')).toEqual([
          'root',
        ]);
        expect(MonthlyExpenseTarget.monthlyExpenseTargetJSONTest(true)).toEqual(
          ['root'],
        );
        expect(MonthlyExpenseTarget.monthlyExpenseTargetJSONTest(null)).toEqual(
          ['root'],
        );
      });
    });

    describe('isMonthlyExpenseTargetJSON', () => {
      test('returns true if the input is valid', () => {
        expect(
          MonthlyExpenseTarget.isMonthlyExpenseTargetJSON(validInput),
        ).toBe(true);
      });

      test('returns false if the input is invalid', () => {
        let invalidInput: Record<string, unknown> = { ...validInput };

        invalidInput = { ...validInput };
        delete invalidInput.dayOfMonth;
        expect(
          MonthlyExpenseTarget.isMonthlyExpenseTargetJSON(invalidInput),
        ).toBe(false);
      });

      test('returns false if the input is not an object', () => {
        expect(MonthlyExpenseTarget.isMonthlyExpenseTargetJSON([])).toBe(false);
        expect(MonthlyExpenseTarget.isMonthlyExpenseTargetJSON(1)).toBe(false);
        expect(MonthlyExpenseTarget.isMonthlyExpenseTargetJSON('')).toBe(false);
        expect(MonthlyExpenseTarget.isMonthlyExpenseTargetJSON(true)).toBe(
          false,
        );
        expect(MonthlyExpenseTarget.isMonthlyExpenseTargetJSON(null)).toBe(
          false,
        );
      });
    });
  });

  describe('DatedExpenseTarget', () => {
    const validInput: DatedExpenseTargetJSON = {
      date: '2024-05-01',
    };

    const expenseTargetInput: ExpenseTargetJSON = {
      type: ExpenseTargetType.Dated,
      data: { ...validInput },
    };

    describe('toJSON', () => {
      test('exports expected data', () => {
        const vi = DatedExpenseTarget.fromJSON(expenseTargetInput);

        expect(vi.toJSON()).toEqual({
          type: ExpenseTargetType.Dated,
          data: vi.dataJSON(),
        });
      });
    });

    describe('fromJSON', () => {
      test('returns an DatedExpenseTarget based on valid input', () => {
        const result = DatedExpenseTarget.fromJSON(expenseTargetInput);

        expect(result.dataJSON()).toEqual(validInput);
      });

      test('toJSON can piped directly into fromJSON', () => {
        const result1 = DatedExpenseTarget.fromJSON(expenseTargetInput);
        const result2 = DatedExpenseTarget.fromJSON(result1.toJSON());

        expect(result1.toJSON()).toEqual(result2.toJSON());
        expect(result1.dataJSON()).toEqual(result2.dataJSON());
      });

      test('throws an error if values are missing from the input', () => {
        let invalidInput: Record<string, unknown> = { ...validInput };
        let json: Record<string, unknown> = {};

        json = {
          type: ExpenseTargetType.Dated,
          data: validInput,
        };
        expect(() => DatedExpenseTarget.fromJSON(json)).not.toThrow();

        invalidInput = { ...validInput };
        delete invalidInput.date;
        json = {
          type: ExpenseTargetType.Dated,
          data: invalidInput,
        };
        expect(() => DatedExpenseTarget.fromJSON(json)).toThrow();

        json = {
          data: validInput,
        };
        expect(() => DatedExpenseTarget.fromJSON(json)).toThrow();

        json = {
          type: ExpenseTargetType.Dated,
        };
        expect(() => DatedExpenseTarget.fromJSON(json)).toThrow();
      });

      test('throws an error if the input is not an object', () => {
        expect(() => DatedExpenseTarget.fromJSON([])).toThrow();
        expect(() => DatedExpenseTarget.fromJSON(1)).toThrow();
        expect(() => DatedExpenseTarget.fromJSON('')).toThrow();
        expect(() => DatedExpenseTarget.fromJSON(true)).toThrow();
        expect(() => DatedExpenseTarget.fromJSON(null)).toThrow();
      });
    });

    describe('datedExpenseTargetJSONTest', () => {
      test('returns an empty array for valid input', () => {
        expect(
          DatedExpenseTarget.datedExpenseTargetJSONTest(validInput),
        ).toEqual([]);
      });

      test('returns an array of strings for invalid input', () => {
        let invalidInput: Record<string, unknown> = { ...validInput };

        invalidInput = { ...validInput };
        delete invalidInput.date;
        expect(
          DatedExpenseTarget.datedExpenseTargetJSONTest(invalidInput),
        ).toEqual(['date']);
      });

      test('returns root if the input is not an object', () => {
        expect(DatedExpenseTarget.datedExpenseTargetJSONTest([])).toEqual([
          'root',
        ]);
        expect(DatedExpenseTarget.datedExpenseTargetJSONTest(1)).toEqual([
          'root',
        ]);
        expect(DatedExpenseTarget.datedExpenseTargetJSONTest('')).toEqual([
          'root',
        ]);
        expect(DatedExpenseTarget.datedExpenseTargetJSONTest(true)).toEqual([
          'root',
        ]);
        expect(DatedExpenseTarget.datedExpenseTargetJSONTest(null)).toEqual([
          'root',
        ]);
      });
    });

    describe('isDatedExpenseTargetJSON', () => {
      test('returns true if the input is valid', () => {
        expect(DatedExpenseTarget.isDatedExpenseTargetJSON(validInput)).toBe(
          true,
        );
      });

      test('returns false if the input is invalid', () => {
        let invalidInput: Record<string, unknown> = { ...validInput };

        invalidInput = { ...validInput };
        delete invalidInput.date;
        expect(DatedExpenseTarget.isDatedExpenseTargetJSON(invalidInput)).toBe(
          false,
        );
      });

      test('returns false if the input is not an object', () => {
        expect(DatedExpenseTarget.isDatedExpenseTargetJSON([])).toBe(false);
        expect(DatedExpenseTarget.isDatedExpenseTargetJSON(1)).toBe(false);
        expect(DatedExpenseTarget.isDatedExpenseTargetJSON('')).toBe(false);
        expect(DatedExpenseTarget.isDatedExpenseTargetJSON(true)).toBe(false);
        expect(DatedExpenseTarget.isDatedExpenseTargetJSON(null)).toBe(false);
      });
    });
  });
});
