import { TaskDeposit } from '@/src/models/vice_bank/task_deposit';
import { Frequency, GetTaskDepositOptions } from '@/src/vice_bank/types';

export abstract class TaskDepositService {
  abstract getTaskDeposits(
    input: GetTaskDepositOptions,
  ): Promise<TaskDeposit[]>;
  abstract getDepositsForFrequency(
    deposit: TaskDeposit,
    frequency: Frequency,
  ): Promise<TaskDeposit[]>;
  abstract addTaskDeposit(deposit: TaskDeposit): Promise<TaskDeposit>;
  abstract updateTaskDeposit(deposit: TaskDeposit): Promise<TaskDeposit>;
  abstract deleteTaskDeposit(depositId: string): Promise<TaskDeposit>;
}
