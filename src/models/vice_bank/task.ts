import { InvalidInputError } from '@/src/errors';
import { isNumber, isRecord, isString } from '@/src/utils/type_guards';
import {
  Frequency,
  frequencyFromString,
  isFrequency,
} from '@/src/vice_bank/types';

export interface TaskJSON {
  id: string;
  vbUserId: string;
  name: string;
  frequency: string;
  tokensPer: number;
}

export class Task {
  constructor(
    protected _id: string,
    protected _vbUserId: string,
    protected _name: string,
    protected _frequency: Frequency,
    protected _tokensPer: number,
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

  get frequency(): Frequency {
    return this._frequency;
  }

  get tokensPer(): number {
    return this._tokensPer;
  }

  toJSON(): TaskJSON {
    return {
      id: this.id,
      vbUserId: this.vbUserId,
      name: this.name,
      frequency: this.frequency,
      tokensPer: this.tokensPer,
    };
  }

  static fromJSON(input: unknown): Task {
    if (!Task.isTaskJSON(input)) {
      const errors = Task.TaskJSONTest(input);
      throw new InvalidInputError(`Invalid JSON ${errors.join(', ')}`);
    }

    return new Task(
      input.id,
      input.vbUserId,
      input.name,
      frequencyFromString(input.frequency),
      input.tokensPer,
    );
  }

  static isTaskJSON(input: unknown): input is TaskJSON {
    const test = Task.TaskJSONTest(input);
    return test.length === 0;
  }

  static TaskJSONTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.id)) output.push('id');
    if (!isString(input.vbUserId)) output.push('vbUserId');
    if (!isString(input.name)) output.push('name');
    if (!isFrequency(input.frequency)) output.push('frequency');
    if (!isNumber(input.tokensPer) && !Number.isNaN(input.tokensPer))
      output.push('tokensPer');

    return output;
  }

  static fromNewTask(id: string, input: Task): Task {
    return Task.fromJSON({ ...input.toJSON(), id });
  }
}
