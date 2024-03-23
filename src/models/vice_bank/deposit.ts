import { DateTime } from 'luxon';

import {
  isNumber,
  isRecord,
  isString,
  isValidDateTimeString,
} from '@/src/utils/type_guards';
import { InvalidInputError } from '@/src/errors';

export interface DepositJSON {
  id: string;
  vbUserId: string;
  date: string;
  depositQuantity: number;
  conversionRate: number;
  actionName: string;
  conversionUnit: string;
}

export class Deposit {
  constructor(
    protected _id: string,
    protected _vbUserId: string,
    protected _date: DateTime<true>,
    protected _depositQuantity: number,
    protected _conversionRate: number,
    protected _actionName: string,
    protected _conversionUnit: string,
  ) {}

  get id(): string {
    return this._id;
  }

  get vbUserId(): string {
    return this._vbUserId;
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

  get actionName(): string {
    return this._actionName;
  }

  get conversionUnit(): string {
    return this._conversionUnit;
  }

  get tokensEarned(): number {
    return this._depositQuantity * this._conversionRate;
  }

  toJSON(): DepositJSON {
    return {
      id: this.id,
      vbUserId: this.vbUserId,
      date: this.date.toISO(),
      depositQuantity: this.depositQuantity,
      conversionRate: this.conversionRate,
      actionName: this.actionName,
      conversionUnit: this.conversionUnit,
    };
  }

  static fromJSON(input: unknown): Deposit {
    if (!Deposit.isDepositJSON(input)) {
      const errors = Deposit.DepositJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    const dateTime = DateTime.fromISO(input.date, { zone: 'America/Chicago' });
    if (!dateTime.isValid) {
      throw new InvalidInputError('Invalid date');
    }

    return new Deposit(
      input.id,
      input.vbUserId,
      dateTime,
      input.depositQuantity,
      input.conversionRate,
      input.actionName,
      input.conversionUnit,
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
    if (!isString(input.vbUserId)) output.push('vbUserId');
    if (!isValidDateTimeString(input.date)) output.push('date');
    if (!isNumber(input.depositQuantity)) output.push('depositQuantity');
    if (!isNumber(input.conversionRate)) output.push('conversionRate');
    if (!isString(input.actionName)) output.push('actionName');
    if (!isString(input.conversionUnit)) output.push('conversionUnit');

    return output;
  }

  static fromNewDeposit(id: string, input: Deposit): Deposit {
    return Deposit.fromJSON({
      ...input.toJSON(),
      id,
    });
  }
}
