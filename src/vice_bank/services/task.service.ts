import { Task } from '@/src/models/vice_bank/task';
import { Injectable } from '@nestjs/common';
import { GetTaskOptions } from '@/src/vice_bank/types';

@Injectable()
export abstract class TaskService {
  abstract getTasks(input: GetTaskOptions): Promise<Task[]>;
  abstract addTask(task: Task): Promise<Task>;
  abstract updateTask(task: Task): Promise<Task>;
  abstract deleteTask(taskId: string): Promise<Task>;
}
