// A budget category is a grouping of expenses that are related to each other.
export class Category {
  constructor(
    protected id: string,
    protected budgetId: string,
    protected name: string,
  ) {}
}
