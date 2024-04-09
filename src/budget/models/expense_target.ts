import { DateTime } from 'luxon';

import { isNumber, isRecord, isString } from '@/src/utils/type_guards';
import { isValidDateString } from '@/src/utils/valid_date';

export enum ExpenseTargetType {
  Weekly = 'weekly',
  // Biweekly = 'biweekly',
  Monthly = 'monthly',
  Dated = 'dated',
}

export function expenseTargetTypeFromString(input: string): ExpenseTargetType {
  switch (input) {
    case 'weekly':
      return ExpenseTargetType.Weekly;
    case 'monthly':
      return ExpenseTargetType.Monthly;
    case 'dated':
      return ExpenseTargetType.Dated;
    default:
      throw new Error('Invalid ExpenseTargetType');
  }
}

export function isExpenseTargetType(
  input: unknown,
): input is ExpenseTargetType {
  if (!isString(input)) {
    return false;
  }

  return input === 'weekly' || input === 'monthly' || input === 'dated';
}

export interface ExpenseTargetJSON {
  type: string;
  data: Record<string, unknown>;
}

// An expense target indicates WHEN you want to spend the money. Different
// targets can be used to indicate different dates or time periods for
// expenses.
export abstract class ExpenseTarget {
  abstract toJSON(): ExpenseTargetJSON;

  static fromJSON(json: unknown): ExpenseTarget {
    if (!ExpenseTarget.isExpenseTargetJSON(json)) {
      const errors = ExpenseTarget.expenseTargetJSONTest(json);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    switch (json.type) {
      case ExpenseTargetType.Weekly:
        return WeeklyExpenseTarget.fromJSON(json);
      case ExpenseTargetType.Monthly:
        return MonthlyExpenseTarget.fromJSON(json);
      case ExpenseTargetType.Dated:
        return DatedExpenseTarget.fromJSON(json);
      default:
        throw new Error('Invalid ExpenseTargetType');
    }
  }

  static isExpenseTargetJSON(input: unknown): input is ExpenseTargetJSON {
    return ExpenseTarget.expenseTargetJSONTest(input).length === 0;
  }

  static expenseTargetJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isExpenseTargetType(input.type)) output.push('type');
    if (!isRecord(input.data)) output.push('data');

    return output;
  }
}

export interface WeeklyExpenseTargetJSON {
  dayOfWeek: number;
}

// Weekly expenses are paid every week. A day that I pay the money on is needed.
// This day is used to determine when the expense is due or starts over.
export class WeeklyExpenseTarget extends ExpenseTarget {
  constructor(protected _dayOfWeek: number) {
    super();
  }

  get dayOfWeek(): number {
    return this._dayOfWeek;
  }

  dataJSON(): WeeklyExpenseTargetJSON {
    return { dayOfWeek: this.dayOfWeek };
  }

  toJSON(): ExpenseTargetJSON {
    return {
      type: ExpenseTargetType.Weekly,
      data: { ...this.dataJSON() },
    };
  }

  static fromJSON(input: unknown): WeeklyExpenseTarget {
    if (!WeeklyExpenseTarget.isExpenseTargetJSON(input)) {
      const errors = WeeklyExpenseTarget.expenseTargetJSONTest(input);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    const data = input.data;

    if (!WeeklyExpenseTarget.isWeeklyExpenseTargetJSON(data)) {
      const errors = WeeklyExpenseTarget.weeklyExpenseTargetJSONTest(data);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
      throw new Error('Invalid day of week');
    }

    return new WeeklyExpenseTarget(data.dayOfWeek);
  }

  static weeklyExpenseTargetJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isNumber(input.dayOfWeek)) output.push('dayOfWeek');

    return output;
  }

  static isWeeklyExpenseTargetJSON(
    input: unknown,
  ): input is WeeklyExpenseTargetJSON {
    return WeeklyExpenseTarget.weeklyExpenseTargetJSONTest(input).length === 0;
  }
}

export interface MonthlyExpenseTargetJSON {
  dayOfMonth: number;
}

// Monthly expenses are paid every month. A start day of the month is needed
// -1 means end of the month
export class MonthlyExpenseTarget extends ExpenseTarget {
  constructor(protected _dayOfMonth: number) {
    super();
  }

  get dayOfMonth(): number {
    return this._dayOfMonth;
  }

  dataJSON(): MonthlyExpenseTargetJSON {
    return { dayOfMonth: this.dayOfMonth };
  }

  toJSON(): ExpenseTargetJSON {
    return {
      type: ExpenseTargetType.Monthly,
      data: { ...this.dataJSON() },
    };
  }

  static fromJSON(input: unknown): MonthlyExpenseTarget {
    if (!MonthlyExpenseTarget.isExpenseTargetJSON(input)) {
      const errors = MonthlyExpenseTarget.expenseTargetJSONTest(input);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    const data = input.data;

    if (!MonthlyExpenseTarget.isMonthlyExpenseTargetJSON(data)) {
      const errors = MonthlyExpenseTarget.monthlyExpenseTargetJSONTest(data);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    if (data.dayOfMonth < -1 || data.dayOfMonth > 31) {
      throw new Error('Invalid day of month');
    }

    return new MonthlyExpenseTarget(data.dayOfMonth);
  }

  static monthlyExpenseTargetJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isNumber(input.dayOfMonth)) output.push('dayOfMonth');

    return output;
  }

  static isMonthlyExpenseTargetJSON(
    input: unknown,
  ): input is MonthlyExpenseTargetJSON {
    return (
      MonthlyExpenseTarget.monthlyExpenseTargetJSONTest(input).length === 0
    );
  }
}

export interface DatedExpenseTargetJSON {
  date: string;
}

// A dated expense target is a one-time expense that is paid on a specific date.
// This is useful for irregular expenses like a birthday gift or a car repair.
// Meanwhile, it can also be used for things like bi-annual bills.
export class DatedExpenseTarget extends ExpenseTarget {
  constructor(protected _date: DateTime<true>) {
    super();
  }

  get date(): DateTime<true> {
    return this._date;
  }

  dataJSON(): DatedExpenseTargetJSON {
    return { date: this.date.toISODate() };
  }

  toJSON(): ExpenseTargetJSON {
    return {
      type: ExpenseTargetType.Dated,
      data: { ...this.dataJSON() },
    };
  }

  static fromJSON(input: unknown): DatedExpenseTarget {
    if (!DatedExpenseTarget.isExpenseTargetJSON(input)) {
      const errors = DatedExpenseTarget.expenseTargetJSONTest(input);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    const data = input.data;

    if (!DatedExpenseTarget.isDatedExpenseTargetJSON(data)) {
      const errors = DatedExpenseTarget.datedExpenseTargetJSONTest(data);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    const date = DateTime.fromISO(data.date, { zone: 'America/Chicago' });

    if (!date.isValid) {
      throw new Error('Invalid date');
    }

    return new DatedExpenseTarget(date);
  }

  static datedExpenseTargetJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isValidDateString(input.date)) output.push('date');

    return output;
  }

  static isDatedExpenseTargetJSON(
    input: unknown,
  ): input is DatedExpenseTargetJSON {
    return DatedExpenseTarget.datedExpenseTargetJSONTest(input).length === 0;
  }
}
