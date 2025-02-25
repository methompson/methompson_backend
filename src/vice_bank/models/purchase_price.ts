import { InvalidInputError } from '@/src/errors';
import { isNumber, isRecord, isString } from '@/src/utils/type_guards';

export interface PurchasePriceJSON {
  id: string;
  vbUserId: string;
  name: string;
  price: number;
}

export class PurchasePrice {
  constructor(
    protected _id: string,
    protected _vbUserId: string,
    protected _name: string,
    protected _price: number,
  ) {}

  get id(): string {
    return this._id;
  }

  get vbUserId(): string {
    return this._vbUserId;
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }

  toJSON(): PurchasePriceJSON {
    return {
      id: this.id,
      vbUserId: this.vbUserId,
      name: this.name,
      price: this.price,
    };
  }

  static fromJSON(input: unknown): PurchasePrice {
    if (!PurchasePrice.isPurchasePriceJSON(input)) {
      const errors = PurchasePrice.PurchasePriceJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    return new PurchasePrice(input.id, input.vbUserId, input.name, input.price);
  }

  static isPurchasePriceJSON(input: unknown): input is PurchasePriceJSON {
    const test = PurchasePrice.PurchasePriceJSONTest(input);

    return test.length === 0;
  }

  static PurchasePriceJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.vbUserId)) output.push('vbUserId');
    if (!isString(input.name)) output.push('name');
    if (!isNumber(input.price)) output.push('price');

    return output;
  }

  static fromNewPurchasePrice(
    id: string,
    purchasePrice: PurchasePrice,
  ): PurchasePrice {
    return PurchasePrice.fromJSON({
      ...purchasePrice.toJSON(),
      id,
    });
  }
}
