import { InvalidInputError } from '@/src/errors';
import { isNumber, isRecord, isString } from '@/src/utils/type_guards';

export interface DepositConversionJSON {
  id: string;
  userId: string;
  name: string;
  rateName: string;
  depositsPer: number;
  tokensPer: number;
  minDeposit: number;
  maxDeposit: number;
}

/**
 * This class represents a deposit conversion.
 * This allows a user to define a type of conversion, the quantity to deposit of the
 * user's action and the amount of tokens you get from this deposit. This allows a
 * user the flexibility to deposit values and get whole tokens or fractions of tokens.
 * For instance, a user could define 15 minutes of walking getting you 1/4 of a token.
 * Or, 1 hour of walking getting you 1 token. Both should result in the same conversion.
 * A user can also define a different kind of conversion, such as taking 10 photos in
 * a day getting you 0.25 tokens, but not allowing you to deposit 5 photos and get 0.125
 * or 40 photos and get 1 token.
 */
export class DepositConversion {
  constructor(
    protected _id: string,
    protected _userId: string,
    protected _name: string,
    protected _rateName: string,
    protected _depositsPer: number,
    protected _tokensPer: number,
    protected _minDeposit: number,
    protected _maxDeposit: number,
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

  get rateName(): string {
    return this._rateName;
  }

  get depositsPer(): number {
    return this._depositsPer;
  }

  get tokensPer(): number {
    return this._tokensPer;
  }

  get minDeposit(): number {
    return this._minDeposit;
  }

  get maxDeposit(): number {
    return this._maxDeposit;
  }

  toJSON(): DepositConversionJSON {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      rateName: this.rateName,
      depositsPer: this.depositsPer,
      tokensPer: this.tokensPer,
      minDeposit: this.minDeposit,
      maxDeposit: this.maxDeposit,
    };
  }

  static fromJSON(input: unknown): DepositConversion {
    if (!DepositConversion.isDepositConversionJSON(input)) {
      const errors = DepositConversion.DepositConversionJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    return new DepositConversion(
      input.id,
      input.userId,
      input.name,
      input.rateName,
      input.depositsPer,
      input.tokensPer,
      input.minDeposit,
      input.maxDeposit,
    );
  }

  static isDepositConversionJSON(
    input: unknown,
  ): input is DepositConversionJSON {
    const test = DepositConversion.DepositConversionJSONTest(input);

    return test.length === 0;
  }

  static DepositConversionJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.userId)) output.push('userId');
    if (!isString(input.name)) output.push('name');
    if (!isString(input.rateName)) output.push('rateName');
    if (!isNumber(input.depositsPer)) output.push('depositsPer');
    if (!isNumber(input.tokensPer)) output.push('tokensPer');
    if (!isNumber(input.minDeposit)) output.push('minDeposit');
    if (!isNumber(input.maxDeposit)) output.push('maxDeposit');

    return output;
  }

  static fromNewDepositConversion(
    id: string,
    input: DepositConversion,
  ): DepositConversion {
    return DepositConversion.fromJSON({
      ...input.toJSON(),
      id,
    });
  }
}
