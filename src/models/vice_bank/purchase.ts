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
  userId: string;
  purchasePriceId: string;
  date: string;
  purchasedQuantity: number;
}

export class Purchase {
  constructor(
    protected _id: string,
    protected _userId: string,
    protected _purchasePriceId: string,
    protected _date: DateTime<true>,
    protected _purchasedQuantity: number,
  ) {}

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
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

  toJSON(): PurchaseJSON {
    return {
      id: this.id,
      userId: this.userId,
      purchasePriceId: this.purchasePriceId,
      date: this.date.toISO(),
      purchasedQuantity: this.purchasedQuantity,
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
      input.userId,
      input.purchasePriceId,
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
    if (!isString(input.userId)) output.push('userId');
    if (!isString(input.purchasePriceId)) output.push('purchasePriceId');
    if (!isValidDateTimeString(input.date)) output.push('date');
    if (!isNumber(input.purchasedQuantity)) output.push('purchasedQuantity');

    return output;
  }

  static fromNewPurchase(id: string, purchase: Purchase): Purchase {
    return Purchase.fromJSON({
      ...purchase.toJSON(),
      id,
    });
  }
}
