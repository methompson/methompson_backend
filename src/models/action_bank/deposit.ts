import { DateTime } from 'luxon';

import {
  isNumber,
  isRecord,
  isString,
  isValidDateTimeString,
} from '@/src/utils/type_guards';

export interface DepositJSON {
  id: string;
  userId: string;
  date: string;
  depositQuantity: number;
  conversionRate: number;
  depositConversionName: string;
}

export class Deposit {
  constructor(
    protected _id: string,
    protected _userId: string,
    protected _date: DateTime<true>,
    protected _depositQuantity: number,
    protected _conversionRate: number,
    protected _depositeConversionName: string,
  ) {}

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get date(): DateTime<true> {
    return this._date;
  }

  get depositQuantity(): number {
    return this._depositQuantity;
  }

  get conversionRate(): number {
    return this._conversionRate;
  }

  get depositConversionName(): string {
    return this._depositeConversionName;
  }

  toJSON(): DepositJSON {
    return {
      id: this.id,
      userId: this.userId,
      date: this.date.toISO(),
      depositQuantity: this.depositQuantity,
      conversionRate: this.conversionRate,
      depositConversionName: this.depositConversionName,
    };
  }

  static fromJSON(input: unknown): Deposit {
    if (!Deposit.isDepositJSON(input)) {
      const errors = Deposit.DepositJSONTest(input);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    const dateTime = DateTime.fromISO(input.date);
    if (!dateTime.isValid) {
      throw new Error('Invalid date');
    }

    return new Deposit(
      input.id,
      input.userId,
      dateTime,
      input.depositQuantity,
      input.conversionRate,
      input.depositConversionName,
    );
  }

  static isDepositJSON(input: unknown): input is DepositJSON {
    const test = Deposit.DepositJSONTest(input);

    return test.length === 0;
  }

  static DepositJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.userId)) output.push('userId');
    if (!isValidDateTimeString(input.date)) output.push('date');
    if (!isNumber(input.depositQuantity)) output.push('depositQuantity');
    if (!isNumber(input.conversionRate)) output.push('conversionRate');
    if (!isString(input.depositConversionName))
      output.push('depositConversionName');

    return output;
  }

  static fromNewDeposit(id: string, input: Deposit): Deposit {
    return Deposit.fromJSON({
      ...input.toJSON(),
      id,
    });
  }
}
