import { isRecord, isString } from '@/src/utils/type_guards';

export interface BudgetJSON {
  id: string;
  userId: string;
  name: string;
}

// A budget is a grouping of costs meant to further a goal. The budget
// is linked to a user and can be named.
export class Budget {
  constructor(
    protected _id: string,
    protected _userId: string,
    protected _name: string,
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

  toJSON(): BudgetJSON {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
    };
  }

  static fromJSON(input: unknown): Budget {
    if (!Budget.isBudgetJSON(input)) {
      const errors = Budget.budgetJSONTest(input);
      throw new Error(`Invalid JSON ${errors.join(', ')}`);
    }

    return new Budget(input.id, input.userId, input.name);
  }

  static isBudgetJSON(input: unknown): input is BudgetJSON {
    return Budget.budgetJSONTest(input).length === 0;
  }

  static budgetJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.userId)) output.push('userId');
    if (!isString(input.name)) output.push('name');

    return output;
  }
}
