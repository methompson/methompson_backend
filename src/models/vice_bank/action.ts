import { InvalidInputError } from '@/src/errors';
import { isNumber, isRecord, isString } from '@/src/utils/type_guards';

export interface ActionJSON {
  id: string;
  vbUserId: string;
  name: string;
  conversionUnit: string;
  depositsPer: number;
  tokensPer: number;
  minDeposit: number;
}

/**
 * This class represents an action
 * This allows a user to define a type of conversion, the quantity to deposit of the
 * user's action and the amount of tokens you get from this deposit. This allows a
 * user the flexibility to deposit values and get whole tokens or fractions of tokens.
 * For instance, a user could define 15 minutes of walking getting you 1/4 of a token.
 * Or, 1 hour of walking getting you 1 token. Both should result in the same conversion.
 * A user can also define a different kind of conversion, such as taking 10 photos in
 * a day getting you 0.25 tokens, but not allowing you to deposit 5 photos and get 0.125
 * or 40 photos and get 1 token.
 */
export class Action {
  constructor(
    protected _id: string,
    protected _vbUserId: string,
    protected _name: string,
    protected _conversionUnit: string,
    protected _depositsPer: number,
    protected _tokensPer: number,
    protected _minDeposit: number,
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

  get conversionUnit(): string {
    return this._conversionUnit;
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

  toJSON(): ActionJSON {
    return {
      id: this.id,
      vbUserId: this.vbUserId,
      name: this.name,
      conversionUnit: this.conversionUnit,
      depositsPer: this.depositsPer,
      tokensPer: this.tokensPer,
      minDeposit: this.minDeposit,
    };
  }

  static fromJSON(input: unknown): Action {
    if (!Action.isActionJSON(input)) {
      const errors = Action.ActionJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    return new Action(
      input.id,
      input.vbUserId,
      input.name,
      input.conversionUnit,
      input.depositsPer,
      input.tokensPer,
      input.minDeposit,
    );
  }

  static isActionJSON(input: unknown): input is ActionJSON {
    const test = Action.ActionJSONTest(input);

    return test.length === 0;
  }

  static ActionJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.vbUserId)) output.push('vbUserId');
    if (!isString(input.name)) output.push('name');
    if (!isString(input.conversionUnit)) output.push('conversionUnit');
    if (!isNumber(input.depositsPer)) output.push('depositsPer');
    if (!isNumber(input.tokensPer)) output.push('tokensPer');
    if (!isNumber(input.minDeposit)) output.push('minDeposit');

    return output;
  }

  static fromNewAction(id: string, input: Action): Action {
    return Action.fromJSON({
      ...input.toJSON(),
      id,
    });
  }
}
