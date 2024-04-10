import { DateTime } from 'luxon';

import { isNumber, isRecord, isString } from '@/src/utils/type_guards';
import { isValidDateString } from '@/src/utils/valid_date';
import { InvalidInputError } from '@/src/errors';

export interface ReconciliationJSON {
  id: string;
  budgetId: string;
  date: string;
  balance: number;
}

// A budget reconciliation is a snapshot of the budget balance at a point in time.
// Everything prior to a reconciliation should be ignored for any budget calculations.
// Reconciliations should be beginning of day.
export class Reconciliation {
  constructor(
    protected _id: string,
    protected _budgetId: string,
    protected _date: DateTime<true>,
    protected _balance: number,
  ) {}

  get id(): string {
    return this._id;
  }
  get budgetId(): string {
    return this._budgetId;
  }
  get date(): DateTime<true> {
    return this._date;
  }
  get balance(): number {
    return this._balance;
  }

  toJSON(): ReconciliationJSON {
    return {
      id: this.id,
      budgetId: this.budgetId,
      date: this.date.toISODate(),
      balance: this.balance,
    };
  }

  static fromNewReconciliation(
    id: string,
    input: Reconciliation,
  ): Reconciliation {
    return Reconciliation.fromJSON({
      ...input.toJSON(),
      id,
    });
  }

  static fromJSON(input: unknown): Reconciliation {
    if (!Reconciliation.isReconciliationJSON(input)) {
      const errors = Reconciliation.reconciliationJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    const dt = DateTime.fromISO(input.date, { zone: 'America/Chicago' });

    if (!dt.isValid) {
      throw new InvalidInputError(`Invalid date, ${input.date}`);
    }

    return new Reconciliation(input.id, input.budgetId, dt, input.balance);
  }

  static isReconciliationJSON(input: unknown): input is ReconciliationJSON {
    return Reconciliation.reconciliationJSONTest(input).length === 0;
  }

  static reconciliationJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.budgetId)) output.push('budgetId');
    if (!isValidDateString(input.date)) output.push('date');
    if (!isNumber(input.balance)) output.push('balance');

    return output;
  }
}
