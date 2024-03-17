import { DateTime } from 'luxon';

import {
  isNumber,
  isRecord,
  isString,
  isValidDateTimeString,
} from '@/src/utils/type_guards';
import { InvalidInputError } from '@/src/errors';

export interface PurchaseJSON {
  id: string;
  vbUserId: string;
  purchasePriceId: string;
  purchasedName: string;
  date: string;
  purchasedQuantity: number;
}

export class Purchase {
  constructor(
    protected _id: string,
    protected _vbUserId: string,
    protected _purchasePriceId: string,
    protected _purchasedName: string,
    protected _date: DateTime<true>,
    protected _purchasedQuantity: number,
  ) {}

  get id(): string {
    return this._id;
  }

  get vbUserId(): string {
    return this._vbUserId;
  }

  get purchasePriceId(): string {
    return this._purchasePriceId;
  }

  get date(): DateTime<true> {
    return this._date;
  }

  get purchasedQuantity(): number {
    return this._purchasedQuantity;
  }

  get purchasedName(): string {
    return this._purchasedName;
  }

  toJSON(): PurchaseJSON {
    return {
      id: this.id,
      vbUserId: this.vbUserId,
      purchasePriceId: this.purchasePriceId,
      date: this.date.toISO(),
      purchasedQuantity: this.purchasedQuantity,
      purchasedName: this.purchasedName,
    };
  }

  static fromJSON(input: unknown): Purchase {
    if (!Purchase.isPurchaseJSON(input)) {
      const errors = Purchase.PurchaseJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    const dateTime = DateTime.fromISO(input.date);
    if (!dateTime.isValid) {
      throw new InvalidInputError('Invalid date');
    }

    return new Purchase(
      input.id,
      input.vbUserId,
      input.purchasePriceId,
      input.purchasedName,
      dateTime,
      input.purchasedQuantity,
    );
  }

  static isPurchaseJSON(input: unknown): input is PurchaseJSON {
    const test = Purchase.PurchaseJSONTest(input);

    return test.length === 0;
  }

  static PurchaseJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.vbUserId)) output.push('vbUserId');
    if (!isString(input.purchasePriceId)) output.push('purchasePriceId');
    if (!isValidDateTimeString(input.date)) output.push('date');
    if (!isNumber(input.purchasedQuantity)) output.push('purchasedQuantity');
    if (!isString(input.purchasedName)) output.push('purchasedName');

    return output;
  }

  static fromNewPurchase(id: string, purchase: Purchase): Purchase {
    return Purchase.fromJSON({
      ...purchase.toJSON(),
      id,
    });
  }
}
