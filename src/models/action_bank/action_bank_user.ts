import { InvalidInputError } from '@/src/errors';
import { isNumber, isRecord, isString } from '@/src/utils/type_guards';

export interface ActionBankUserJSON {
  id: string;
  name: string;
  currentTokens: number;
}

export class ActionBankUser {
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

  toJSON(): ActionBankUserJSON {
    return {
      id: this.id,
      name: this.name,
      currentTokens: this.currentTokens,
    };
  }

  static fromJSON(input: unknown): ActionBankUser {
    if (!ActionBankUser.isActionBankUserJSON(input)) {
      const errors = ActionBankUser.ActionBankUserJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    return new ActionBankUser(input.id, input.name, input.currentTokens);
  }

  static isActionBankUserJSON(input: unknown): input is ActionBankUserJSON {
    const test = ActionBankUser.ActionBankUserJSONTest(input);

    return test.length === 0;
  }

  static ActionBankUserJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.name)) output.push('name');
    if (!isNumber(input.currentTokens)) output.push('currentTokens');

    return output;
  }

  static fromNewActionBankUser(
    id: string,
    input: ActionBankUser,
  ): ActionBankUser {
    return ActionBankUser.fromJSON({
      ...input.toJSON(),
      id,
    });
  }
}
