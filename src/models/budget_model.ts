export class BudgetType {
  protected _updatedDate: string;

  constructor(
    protected _id: string,
    protected _name: string,
    protected _amount: number,
    protected _createdDate: string,
    updatedDate: string | undefined,
  ) {
    this._updatedDate = updatedDate || _createdDate;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get amount(): number {
    return this._amount;
  }

  get createdDate(): string {
    return this._createdDate;
  }

  get updatedDate(): string {
    return this._updatedDate;
  }
}

export class BudgetItem {
  constructor(
    protected id: string,
    protected budget_type: string,
    protected name: string,
    protected amount: number,
    protected created_at: string,
  ) {}
}
