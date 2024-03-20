import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { TaskService } from './task.service';
import { Task } from '@/src/models/vice_bank/task';
import { GetTaskOptions } from '@/src/vice_bank/types';
import { isNullOrUndefined } from '@/src/utils/type_guards';

@Injectable()
export class InMemoryTaskService implements TaskService {
  // first key is the task ID
  protected _tasks: Record<string, Task> = {};

  constructor(tasks?: Task[]) {
    if (tasks) {
      for (const task of tasks) {
        this._tasks[task.id] = task;
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

  async getTasks(input: GetTaskOptions): Promise<Task[]> {
    const tasks = this._tasks[input.userId] ?? [];

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

    return task;
  }

  async deleteTask(taskId: string): Promise<Task> {
    const existingTask = this._tasks[taskId];

    if (isNullOrUndefined(existingTask)) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    delete this._tasks[taskId];

    return existingTask;
  }
}
