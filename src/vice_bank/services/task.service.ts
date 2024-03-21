import { Injectable } from '@nestjs/common';

import { Task } from '@/src/models/vice_bank/task';
import {
  TaskDepositResponse,
  Frequency,
  GetTaskDepositOptions,
  GetTaskOptions,
} from '@/src/vice_bank/types';
import { TaskDeposit } from '@/src/models/vice_bank/task_deposit';

@Injectable()
export abstract class TaskService {
  abstract getTasks(input: GetTaskOptions): Promise<Task[]>;
  abstract addTask(task: Task): Promise<Task>;
  abstract updateTask(task: Task): Promise<Task>;
  abstract deleteTask(taskId: string): Promise<Task>;

  abstract getTaskDeposits(
    input: GetTaskDepositOptions,
  ): Promise<TaskDeposit[]>;
  abstract getDepositsForFrequency(
    deposit: TaskDeposit,
    frequency: Frequency,
  ): Promise<TaskDeposit[]>;
  abstract addTaskDeposit(deposit: TaskDeposit): Promise<TaskDepositResponse>;
  abstract updateTaskDeposit(
    deposit: TaskDeposit,
  ): Promise<TaskDepositResponse>;
  abstract deleteTaskDeposit(depositId: string): Promise<TaskDepositResponse>;
}
