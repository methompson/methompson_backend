import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';

import { TaskService } from './task.service';
import { Task } from '@/src/models/vice_bank/task';
import {
  Frequency,
  GetTaskDepositOptions,
  GetTaskOptions,
} from '@/src/vice_bank/types';
import { isNullOrUndefined, isRecord } from '@/src/utils/type_guards';
import { TaskDeposit } from '@/src/models/vice_bank/task_deposit';

@Injectable()
export class InMemoryTaskService implements TaskService {
  // first key is the task ID
  protected _tasks: Record<string, Task> = {};

  protected _taskDeposits: Record<string, TaskDeposit> = {};

  constructor(options?: { tasks?: Task[]; deposits?: TaskDeposit[] }) {
    if (!isRecord(options)) {
      return;
    }

    const { tasks, deposits } = options;

    if (tasks) {
      for (const task of tasks) {
        this._tasks[task.id] = task;
      }
    }

    if (deposits) {
      for (const i of deposits) {
        this._taskDeposits[i.id] = i;
      }
    }
  }

  get tasks(): Record<string, Task> {
    return { ...this._tasks };
  }

  get tasksList(): Task[] {
    const list = Object.values(this._tasks);
    list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }

  get taskDeposits(): Record<string, TaskDeposit> {
    return { ...this._taskDeposits };
  }

  get taskDepositsList(): TaskDeposit[] {
    return Object.values(this.taskDeposits);
  }

  async getTasks(input: GetTaskOptions): Promise<Task[]> {
    const tasks = this.tasksList.filter((t) => t.vbUserId === input.userId);

    tasks.sort((a, b) => a.name.localeCompare(b.name));

    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const list = Object.values(tasks).slice(skip, end);

    return list;
  }

  async addTask(task: Task): Promise<Task> {
    const id = uuidv4();

    const newTask = Task.fromNewTask(id, task);

    this._tasks[id] = newTask;

    return newTask;
  }

  async updateTask(task: Task): Promise<Task> {
    const existingTask = this._tasks[task.id];

    if (isNullOrUndefined(existingTask)) {
      throw new Error(`Task with ID ${task.id} not found`);
    }

    this._tasks[task.id] = task;

    return existingTask;
  }

  async deleteTask(taskId: string): Promise<Task> {
    const existingTask = this._tasks[taskId];

    if (isNullOrUndefined(existingTask)) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    delete this._tasks[taskId];

    return existingTask;
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
    const task = this._tasks[deposit.taskId];

    if (isNullOrUndefined(task)) {
      throw new Error(`Task with ID ${deposit.taskId} not found`);
    }

    const id = uuidv4();
    let newDeposit = TaskDeposit.fromNewTaskDeposit(id, deposit);

    const existingDeposits = await this.getDepositsForFrequency(
      deposit,
      task.frequency,
    );

    if (existingDeposits.length > 0) {
      newDeposit = newDeposit.withTokensEarned(0);
    }

    this._taskDeposits[id] = newDeposit;

    return newDeposit;
  }

  async updateTaskDeposit(deposit: TaskDeposit): Promise<TaskDeposit> {
    const { id } = deposit;
    const existingDeposit = this._taskDeposits[id];

    if (isNullOrUndefined(existingDeposit)) {
      throw new Error(`Deposit with ID ${id} not found`);
    }

    const existingDeposits = await this.getDepositsForFrequency(
      deposit,
      existingDeposit.frequency,
    );

    const filtered = existingDeposits.filter((d) => d.id !== id);

    let depositToUpload = deposit;

    // If the deposit in question is NOT in the list, we have to set the tokens
    // to 0 if it's not already set. This will happen if the date is different.
    if (existingDeposits.length === filtered.length) {
      const result = filtered.reduce((acc, curr) => acc + curr.tokensEarned, 0);
      if (result > 0) depositToUpload = deposit.withTokensEarned(0);
      else depositToUpload = deposit.withTokensEarned(deposit.conversionRate);

      // They are in the list and the only one. We check if tokens earned is 0.
      // and if it is, we set it to the conversion rate. This will happen if a non-
      // token value was updated.
    } else if (existingDeposits.length === 1) {
      depositToUpload = deposit.withTokensEarned(deposit.conversionRate);

      // For any situation where this task exists with other tasks.
    } else if (existingDeposits.length > 1) {
      const deposits = this.updateTaskDepositTokens(existingDeposits);

      for (const deposit of deposits) {
        this._taskDeposits[deposit.id] = deposit;
      }
    }

    this._taskDeposits[id] = depositToUpload;

    return existingDeposit;
  }

  updateTaskDepositTokens(deposits: TaskDeposit[]): TaskDeposit[] {
    const output: TaskDeposit[] = [];

    deposits
      .sort((a, b) => a.date.toMillis() - b.date.toMillis())
      .forEach((task, index) => {
        const tokensEarned = index === 0 ? task.conversionRate : 0;
        output.push(task.withTokensEarned(tokensEarned));
      });

    return output;
  }

  async deleteTaskDeposit(depositId: string): Promise<TaskDeposit> {
    const existingDeposit = this._taskDeposits[depositId];

    if (isNullOrUndefined(existingDeposit)) {
      throw new Error(`Deposit with ID ${depositId} not found`);
    }

    delete this._taskDeposits[depositId];

    const existingDeposits = await this.getDepositsForFrequency(
      existingDeposit,
      existingDeposit.frequency,
    );

    // If there are no other deposits for this frequency, we can short
    // circuit and return the existing deposit.
    if (existingDeposits.length === 0) {
      return existingDeposit;
    }

    // We'll see if there are any tokens earned for the existing deposits
    const tokensEarned = existingDeposits.reduce(
      (acc, cur) => acc + cur.tokensEarned,
      0,
    );

    // If there are no tokens earned, we'll set the first deposit to the
    // conversion rate.
    if (tokensEarned === 0) {
      existingDeposits.sort((a, b) => a.date.toMillis() - b.date.toMillis());
      const firstDeposit = existingDeposits[0];

      if (isNullOrUndefined(firstDeposit)) {
        // We shouldn't get here, but we need to check for TS
        throw new Error('No first deposit found');
      }

      // We set the first deposit to tokens earned and return it
      const updatedDeposit = firstDeposit.withTokensEarned(
        firstDeposit.conversionRate,
      );

      this._taskDeposits[firstDeposit.id] = updatedDeposit;
    }

    return existingDeposit;
  }
}
