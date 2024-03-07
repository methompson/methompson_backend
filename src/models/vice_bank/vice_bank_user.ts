import { InvalidInputError } from '@/src/errors';
import { isNumber, isRecord, isString } from '@/src/utils/type_guards';

export interface ViceBankUserJSON {
  id: string;
  name: string;
  currentTokens: number;
}

export class ViceBankUser {
  constructor(
    protected _id: string,
    protected _name: string,
    protected _currentTokens: number,
  ) {}

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get currentTokens(): number {
    return this._currentTokens;
  }

  toJSON(): ViceBankUserJSON {
    return {
      id: this.id,
      name: this.name,
      currentTokens: this.currentTokens,
    };
  }

  static fromJSON(input: unknown): ViceBankUser {
    if (!ViceBankUser.isViceBankUserJSON(input)) {
      const errors = ViceBankUser.ViceBankUserJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    return new ViceBankUser(input.id, input.name, input.currentTokens);
  }

  static isViceBankUserJSON(input: unknown): input is ViceBankUserJSON {
    const test = ViceBankUser.ViceBankUserJSONTest(input);

    return test.length === 0;
  }

  static ViceBankUserJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.name)) output.push('name');
    if (!isNumber(input.currentTokens)) output.push('currentTokens');

    return output;
  }

  static fromNewViceBankUser(id: string, input: ViceBankUser): ViceBankUser {
    return ViceBankUser.fromJSON({
      ...input.toJSON(),
      id,
    });
  }
}
