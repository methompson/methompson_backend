import { DateTime } from 'luxon';

import { isNumber, isRecord, isString } from '@/src/utils/type_guards';
import { isValidDateString } from '@/src/utils/valid_date';
import { InvalidInputError } from '@/src/errors';

export interface DepositTransactionJSON {
  id: string;
  budgetId: string;
  description: string;
  dateTime: string;
  amount: number;
}

// All numeric values should be in CENTS, not dollars

export class DepositTransaction {
  constructor(
    protected _id: string,
    protected _budgetId: string,
    protected _description: string,
    protected _dateTime: DateTime<true>,
    protected _amount: number,
  ) {}

  get id(): string {
    return this._id;
  }
  get budgetId(): string {
    return this._budgetId;
  }
  get description(): string {
    return this._description;
  }
  get dateTime(): DateTime<true> {
    return this._dateTime;
  }
  get amount(): number {
    return this._amount;
  }

  toJSON(): DepositTransactionJSON {
    return {
      id: this._id,
      budgetId: this._budgetId,
      description: this._description,
      dateTime: this._dateTime.toISO(),
      amount: this._amount,
    };
  }

  static fromNewDepositTransaction(
    id: string,
    input: DepositTransaction,
  ): DepositTransaction {
    return DepositTransaction.fromJSON({
      ...input.toJSON(),
      id,
    });
  }

  static fromJSON(input: unknown): DepositTransaction {
    if (!DepositTransaction.isDepositTransactionJSON(input)) {
      const errors = DepositTransaction.depositTransactionTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    const { id, budgetId, description, dateTime: date, amount } = input;

    const dt = DateTime.fromISO(date, { zone: 'America/Chicago' });
    if (!dt.isValid) {
      throw new InvalidInputError(`Invalid date: ${date}`);
    }

    return new DepositTransaction(id, budgetId, description, dt, amount);
  }

  static isDepositTransactionJSON(
    input: unknown,
  ): input is DepositTransactionJSON {
    return DepositTransaction.depositTransactionTest(input).length === 0;
  }

  static depositTransactionTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.budgetId)) output.push('budgetId');
    if (!isString(input.description)) output.push('description');
    if (!isValidDateString(input.dateTime)) output.push('date');
    if (!isNumber(input.amount)) output.push('amount');

    return output;
  }
}
