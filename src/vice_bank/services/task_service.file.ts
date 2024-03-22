import { Injectable } from '@nestjs/common';

import { InMemoryTaskService } from './task_service.memory';
import { Task } from '@/src/models/vice_bank/task';
import { TaskDeposit } from '@/src/models/vice_bank/task_deposit';
import { FileServiceWriter } from '@/src/utils/file_service_writer';
import { TaskDepositResponse } from '@/src/vice_bank/types';
import { isRecord } from '@/src/utils/type_guards';

const BASE_NAME = 'task_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileTaskService extends InMemoryTaskService {
  constructor(
    protected readonly fileServiceWriter: FileServiceWriter,
    protected readonly viceBankPath: string,
    options?: { tasks?: Task[]; taskDeposits?: TaskDeposit[] },
  ) {
    super(options);
  }

  get taskString(): string {
    return JSON.stringify({
      tasks: Object.values(this.tasks),
      taskDeposits: Object.values(this.taskDeposits),
    });
  }

  async addTask(task: Task): Promise<Task> {
    const result = await super.addTask(task);

    await this.writeToFile();

    return result;
  }

  async updateTask(task: Task): Promise<Task> {
    const result = await super.updateTask(task);

    await this.writeToFile();

    return result;
  }

  async deleteTask(taskId: string): Promise<Task> {
    const result = await super.deleteTask(taskId);

    await this.writeToFile();

    return result;
  }

  async addTaskDeposit(taskDeposit: TaskDeposit): Promise<TaskDepositResponse> {
    const result = await super.addTaskDeposit(taskDeposit);

    await this.writeToFile();

    return result;
  }

  async updateTaskDeposit(
    taskDeposit: TaskDeposit,
  ): Promise<TaskDepositResponse> {
    const result = await super.updateTaskDeposit(taskDeposit);

    await this.writeToFile();

    return result;
  }

  async deleteTaskDeposit(taskDepositId: string): Promise<TaskDepositResponse> {
    const result = await super.deleteTaskDeposit(taskDepositId);

    await this.writeToFile();

    return result;
  }

  async writeToFile(): Promise<void> {
    const json = this.taskString;

    await this.fileServiceWriter.writeToFile(this.viceBankPath, json);
  }

  static async init(
    viceBankPath: string,
    options?: { fileServiceWriter?: FileServiceWriter },
  ): Promise<FileTaskService> {
    const fileServiceWriter =
      options?.fileServiceWriter ??
      new FileServiceWriter(BASE_NAME, FILE_EXTENSION);

    let rawData = '';

    const tasks: Task[] = [];
    const taskDeposits: TaskDeposit[] = [];

    try {
      rawData = await fileServiceWriter.readFile(viceBankPath);

      const json = JSON.parse(rawData);

      if (!isRecord(json)) {
        throw new Error('Invalid JSON');
      }

      if (Array.isArray(json.tasks)) {
        for (const val of json.tasks) {
          try {
            tasks.push(Task.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }

      if (Array.isArray(json.taskDeposits)) {
        for (const val of json.taskDeposits) {
          try {
            taskDeposits.push(TaskDeposit.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }
    } catch (e) {
      try {
        if (rawData.length > 0) {
          console.error('Invalid or no data when reading file data file', e);
          await fileServiceWriter.writeBackup(viceBankPath, rawData);
        } else {
          console.error('Init: No file data found. Creating new file.');
        }

        await fileServiceWriter.clearFile(viceBankPath);
      } catch (e) {
        console.error('unable to write to disk', e);
      }
    }

    return new FileTaskService(fileServiceWriter, viceBankPath, {
      tasks,
      taskDeposits,
    });
  }
}
