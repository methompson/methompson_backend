import { InvalidInputError } from '@/src/errors';
import {
  isNumber,
  isRecord,
  isString,
  isValidDateTimeString,
} from '@/src/utils/type_guards';
import { DateTime } from 'luxon';

export interface TaskDepositJSON {
  id: string;
  vbUserId: string;
  date: string;
  taskName: string;
  taskId: string;
  tokensEarned: number;
}

export class TaskDeposit {
  constructor(
    protected _id: string,
    protected _vbUserId: string,
    protected _date: DateTime<true>,
    protected _taskName: string,
    protected _taskId: string,
    protected _tokensEarned: number,
  ) {}

  get id(): string {
    return this._id;
  }

  get vbUserId(): string {
    return this._vbUserId;
  }

  get date(): DateTime<true> {
    return this._date;
  }

  get taskName(): string {
    return this._taskName;
  }

  get taskId(): string {
    return this._taskId;
  }

  get tokensEarned(): number {
    return this._tokensEarned;
  }

  toJSON(): TaskDepositJSON {
    return {
      id: this.id,
      vbUserId: this.vbUserId,
      date: this.date.toISO(),
      taskName: this.taskName,
      taskId: this.taskId,
      tokensEarned: this.tokensEarned,
    };
  }

  static fromJSON(input: unknown): TaskDeposit {
    if (!TaskDeposit.isTaskDepositJSON(input)) {
      const errors = TaskDeposit.TaskDepositJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    const dateTime = DateTime.fromISO(input.date, { zone: 'America/Chicago' });
    if (!dateTime.isValid) {
      throw new InvalidInputError('Invalid date');
    }

    return new TaskDeposit(
      input.id,
      input.vbUserId,
      dateTime,
      input.taskName,
      input.taskId,
      input.tokensEarned,
    );
  }

  static isTaskDepositJSON(input: unknown): input is TaskDepositJSON {
    const test = TaskDeposit.TaskDepositJSONTest(input);

    return test.length === 0;
  }

  static TaskDepositJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.vbUserId)) output.push('vbUserId');
    if (!isValidDateTimeString(input.date)) output.push('date');
    if (!isString(input.taskName)) output.push('taskName');
    if (!isString(input.taskId)) output.push('taskId');
    if (!isNumber(input.tokensEarned)) output.push('tokensEarned');

    return output;
  }

  static fromNewTaskDeposit(id: string, taskDeposit: TaskDeposit): TaskDeposit {
    return TaskDeposit.fromJSON({
      ...taskDeposit.toJSON(),
      id,
    });
  }
}
