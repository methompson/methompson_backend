import { isNumber, isRecord, isString } from '@/src/utils/type_guards';

export interface PurchasePriceJSON {
  id: string;
  userId: string;
  name: string;
  price: number;
}

export class PurchasePrice {
  constructor(
    protected _id: string,
    protected _userId: string,
    protected _name: string,
    protected _price: number,
  ) {}

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
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
      userId: this.userId,
      name: this.name,
      price: this.price,
    };
  }

  static fromJSON(input: unknown): PurchasePrice {
    if (!PurchasePrice.isPurchasePriceJSON(input)) {
      const errors = PurchasePrice.PurchasePriceJSONTest(input);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    return new PurchasePrice(input.id, input.userId, input.name, input.price);
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
    if (!isString(input.userId)) output.push('userId');
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
