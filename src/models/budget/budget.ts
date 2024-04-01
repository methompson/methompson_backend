// A budget is a grouping of costs meant to further a goal. The budget
// is linked to a user and can be named.
export class Budget {
  constructor(
    protected _id: string,
    protected _userId: string,
    protected _name: string,
  ) {}
}
