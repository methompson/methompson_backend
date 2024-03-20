import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';

import { TaskDeposit } from '@/src/models/vice_bank/task_deposit';
import { TaskDepositService } from './task_deposit.service';
import { Frequency, GetTaskDepositOptions } from '@/src/vice_bank/types';
import { isNullOrUndefined } from '@/src/utils/type_guards';

export class InMemoryTaskDepositService implements TaskDepositService {
  _taskDeposits: Record<string, TaskDeposit> = {};

  constructor(deposits?: TaskDeposit[]) {
    if (deposits) {
      for (const i of deposits) {
        this._taskDeposits[i.id] = i;
      }
    }
  }

  get taskDeposits(): Record<string, TaskDeposit> {
    return { ...this._taskDeposits };
  }

  get taskDepositsList(): TaskDeposit[] {
    return Object.values(this.taskDeposits);
  }

  async getTaskDeposits(input: GetTaskDepositOptions): Promise<TaskDeposit[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const userId = input.userId;

    const startDate = DateTime.fromISO(input?.startDate ?? 'bad', {
      zone: 'America/Chicago',
    });
    const endDate = DateTime.fromISO(input?.endDate ?? 'bad', {
      zone: 'America/Chicago',
    });

    const deposits = this.taskDepositsList.filter((d) => {
      if (d.vbUserId !== userId) return false;
      if (startDate.isValid && d.date < startDate) return false;
      if (endDate.isValid && d.date > endDate) return false;
      if (input.taskId && d.taskId !== input.taskId) return false;

      return true;
    });

    deposits.sort((a, b) => a.date.toMillis() - b.date.toMillis());
    const output = deposits.slice(skip, end);

    return output;
  }

  async getDepositsForFrequency(
    deposit: TaskDeposit,
    frequency: Frequency,
  ): Promise<TaskDeposit[]> {
    let start: DateTime<true>;
    let end: DateTime<true>;

    switch (frequency) {
      case Frequency.Daily:
        start = deposit.date.startOf('day');
        end = deposit.date.endOf('day');
        break;
      case Frequency.Weekly:
        start = deposit.date.startOf('week');
        end = deposit.date.endOf('week');
        break;
      case Frequency.Monthly:
        start = deposit.date.startOf('month');
        end = deposit.date.endOf('month');
        break;
    }

    const deposits = await this.getTaskDeposits({
      userId: deposit.vbUserId,
      startDate: start.toISO(),
      endDate: end.toISO(),
      taskId: deposit.taskId,
    });

    return deposits;
  }

  async addTaskDeposit(deposit: TaskDeposit): Promise<TaskDeposit> {
    const id = uuidv4();

    const newDeposit = TaskDeposit.fromNewTaskDeposit(id, deposit);
    this._taskDeposits[id] = newDeposit;

    return newDeposit;
  }

  async updateTaskDeposit(deposit: TaskDeposit): Promise<TaskDeposit> {
    const { id } = deposit;
    const existingDeposit = this._taskDeposits[id];

    if (isNullOrUndefined(existingDeposit)) {
      throw new Error(`Deposit with ID ${id} not found`);
    }

    if (deposit.tokensEarned === existingDeposit.tokensEarned) {
      throw new Error('Tokens earned mismatch');
    }

    this._taskDeposits[id] = deposit;

    return existingDeposit;
  }

  async deleteTaskDeposit(depositId: string): Promise<TaskDeposit> {
    const existingDeposit = this._taskDeposits[depositId];

    if (isNullOrUndefined(existingDeposit)) {
      throw new Error(`Deposit with ID ${depositId} not found`);
    }

    delete this._taskDeposits[depositId];

    return existingDeposit;
  }
}
