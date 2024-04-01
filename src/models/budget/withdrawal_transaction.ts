import { DateTime } from 'luxon';

import { isNumber, isRecord, isString } from '@/src/utils/type_guards';
import { isValidDateString } from '@/src/utils/valid_date';

export interface WithdrawalTransactionJSON {
  id: string;
  budgetId: string;
  expenseId: string;
  description: string;
  date: string;
  amount: number;
}

export class WithdrawalTransaction {
  constructor(
    protected _id: string,
    protected _budgetId: string,
    protected _expenseId: string,
    protected _description: string,
    protected _date: DateTime<true>,
    protected _amount: number,
  ) {}

  get id(): string {
    return this._id;
  }
  get budgetId(): string {
    return this._budgetId;
  }
  get expenseId(): string {
    return this._expenseId;
  }
  get description(): string {
    return this._description;
  }
  get date(): DateTime<true> {
    return this._date;
  }
  get amount(): number {
    return this._amount;
  }

  toJSON(): WithdrawalTransactionJSON {
    return {
      id: this._id,
      budgetId: this._budgetId,
      expenseId: this._expenseId,
      description: this._description,
      date: this._date.toISO(),
      amount: this._amount,
    };
  }

  static fromJSON(input: WithdrawalTransactionJSON): WithdrawalTransaction {
    if (!WithdrawalTransaction.isWithdrawalTransactionJSON(input)) {
      const errors = WithdrawalTransaction.withdrawalTransactionTest(input);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    const { id, budgetId, expenseId, description, date, amount } = input;

    const dt = DateTime.fromISO(date, { zone: 'America/Chicago' });
    if (!dt.isValid) {
      throw new Error(`Invalid date: ${date}`);
    }

    return new WithdrawalTransaction(
      id,
      budgetId,
      expenseId,
      description,
      dt,
      amount,
    );
  }

  static isWithdrawalTransactionJSON(
    input: unknown,
  ): input is WithdrawalTransactionJSON {
    return WithdrawalTransaction.withdrawalTransactionTest(input).length === 0;
  }

  static withdrawalTransactionTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.budgetId)) output.push('budgetId');
    if (!isString(input.expenseId)) output.push('expenseId');
    if (!isString(input.description)) output.push('description');
    if (!isValidDateString(input.date)) output.push('date');
    if (!isNumber(input.amount)) output.push('amount');

    return output;
  }
}
