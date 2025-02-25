import { InvalidInputError } from '@/src/errors';
import { isRecord, isString } from '@/src/utils/type_guards';

export interface CategoryJSON {
  id: string;
  budgetId: string;
  name: string;
}

// A budget category is a grouping of expenses that are related to each other.
export class Category {
  constructor(
    protected _id: string,
    protected _budgetId: string,
    protected _name: string,
  ) {}

  get id(): string {
    return this._id;
  }

  get budgetId(): string {
    return this._budgetId;
  }

  get name(): string {
    return this._name;
  }

  toJSON(): CategoryJSON {
    return {
      id: this.id,
      budgetId: this.budgetId,
      name: this.name,
    };
  }

  static fromJSON(input: unknown): Category {
    if (!Category.isCategoryJSON(input)) {
      const errors = Category.categoryJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    return new Category(input.id, input.budgetId, input.name);
  }

  static isCategoryJSON(input: unknown): input is Category {
    return Category.categoryJSONTest(input).length === 0;
  }

  static categoryJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.budgetId)) output.push('budgetId');
    if (!isString(input.name)) output.push('name');

    return output;
  }
}
