import {
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { TaskService } from '@/src/vice_bank/services/task.service';
import { LoggerService } from '@/src/logger/logger.service';
import { type METIncomingMessage } from '@/src/utils/met_incoming_message';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { commonErrorHandler } from '@/src/utils/common_error_handler';
import { isNullOrUndefined, isRecord, isString } from '@/src/utils/type_guards';
import { InvalidInputError, NotFoundError } from '@/src/errors';
import { Task, TaskJSON } from '@/src/models/vice_bank/task';
import {
  TaskDeposit,
  TaskDepositJSON,
} from '@/src/models/vice_bank/task_deposit';
import { ViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service';

interface GetTasksResponse {
  tasks: TaskJSON[];
}

interface AddTaskResponse {
  task: TaskJSON;
}

interface UpdateTaskResponse {
  task: TaskJSON;
}

interface DeleteTaskResponse {
  task: TaskJSON;
}

interface GetTaskDepositsResponse {
  taskDeposits: TaskDeposit[];
}

interface AddTaskDepositResponse {
  taskDeposit: TaskDepositJSON;
  currentTokens: number;
}

interface UpdateTaskDepositResponse {
  taskDeposit: TaskDepositJSON;
  oldTaskDeposit: TaskDepositJSON;
  currentTokens: number;
}

interface DeleteTaskDepositResponse {
  taskDeposit: TaskDepositJSON;
  currentTokens: number;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/vice_bank' })
export class TaskController {
  constructor(
    @Inject('TASK_SERVICE')
    private readonly taskService: TaskService,
    @Inject('VICE_BANK_USER_SERVICE')
    private readonly viceBankUserService: ViceBankUserService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('tasks')
  async getTasks(
    @Req() request: METIncomingMessage,
  ): Promise<GetTasksResponse> {
    const { page, pagination } = pageAndPagination(request);

    try {
      if (!isRecord(request.query)) {
        throw new InvalidInputError('Invalid Query');
      }

      const { userId } = request.query;

      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      const tasks = (
        await this.taskService.getTasks({
          userId,
          page,
          pagination,
        })
      ).map((task) => task.toJSON());

      return { tasks };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addTask')
  async addTask(@Req() request: METIncomingMessage): Promise<AddTaskResponse> {
    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Body');
      }

      const newTask = Task.fromJSON(body.task);

      const uploadedTask = await this.taskService.addTask(newTask);

      return { task: uploadedTask.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateTask')
  async updateTask(
    @Req() request: METIncomingMessage,
  ): Promise<UpdateTaskResponse> {
    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Body');
      }

      const task = Task.fromJSON(body.task);

      const result = await this.taskService.updateTask(task);

      return { task: result.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteTask')
  async deleteTask(
    @Req() request: METIncomingMessage,
  ): Promise<DeleteTaskResponse> {
    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const { body } = request;

      if (!isRecord(body) || !isString(body.taskId)) {
        throw new InvalidInputError('Invalid Body');
      }

      const result = await this.taskService.deleteTask(body.taskId);

      return { task: result.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Get('taskDeposits')
  async getTaskDeposits(
    @Req() request: METIncomingMessage,
  ): Promise<GetTaskDepositsResponse> {
    const { page, pagination } = pageAndPagination(request);

    try {
      if (!isRecord(request.query)) {
        throw new InvalidInputError('Invalid Query');
      }

      let { startDate, endDate, taskId } = request.query;
      const { userId } = request.query;

      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      startDate = isString(startDate) ? startDate : undefined;
      endDate = isString(endDate) ? endDate : undefined;
      taskId = isString(taskId) ? taskId : undefined;

      const taskDeposits = await this.taskService.getTaskDeposits({
        page,
        pagination,
        userId,
        startDate,
        endDate,
        taskId,
      });

      return { taskDeposits };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addTaskDeposit')
  async addTaskDeposit(
    @Req() request: METIncomingMessage,
  ): Promise<AddTaskDepositResponse> {
    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Body');
      }

      const newDeposit = TaskDeposit.fromJSON(body.taskDeposit);

      const user = await this.viceBankUserService.getViceBankUser(
        newDeposit.vbUserId,
      );

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(
          `User with ID ${newDeposit.vbUserId} not found`,
        );
      }

      const result = await this.taskService.addTaskDeposit(newDeposit);

      const currentTokens = user.currentTokens + result.tokensAdded;
      const userToUpdate = user.copyWith({ currentTokens });

      await this.viceBankUserService.updateViceBankUser(userToUpdate);

      return {
        taskDeposit: result.taskDeposit.toJSON(),
        currentTokens,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateTaskDeposit')
  async updateTaskDeposit(
    @Req() request: METIncomingMessage,
  ): Promise<UpdateTaskDepositResponse> {
    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Body');
      }

      const taskDeposit = TaskDeposit.fromJSON(body.taskDeposit);

      const user = await this.viceBankUserService.getViceBankUser(
        taskDeposit.vbUserId,
      );

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(
          `User with ID ${taskDeposit.vbUserId} not found`,
        );
      }

      const result = await this.taskService.updateTaskDeposit(taskDeposit);

      const currentTokens = user.currentTokens + result.tokensAdded;
      const userToUpdate = user.copyWith({ currentTokens });

      await this.viceBankUserService.updateViceBankUser(userToUpdate);

      return {
        taskDeposit: taskDeposit.toJSON(),
        oldTaskDeposit: result.taskDeposit.toJSON(),
        currentTokens,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteTaskDeposit')
  async deleteTaskDeposit(
    @Req() request: METIncomingMessage,
  ): Promise<DeleteTaskDepositResponse> {
    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const { body } = request;

      if (!isRecord(body) || !isString(body.taskDepositId)) {
        throw new InvalidInputError('Invalid Body');
      }

      const result = await this.taskService.deleteTaskDeposit(
        body.taskDepositId,
      );

      const user = await this.viceBankUserService.getViceBankUser(
        result.taskDeposit.vbUserId,
      );

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(
          `User with ID ${result.taskDeposit.vbUserId} not found`,
        );
      }

      // Tokens earned will be negative if we are deleting any deposits that have tokens
      const currentTokens = user.currentTokens + result.tokensAdded;
      const userToUpdate = user.copyWith({ currentTokens });

      await this.viceBankUserService.updateViceBankUser(userToUpdate);

      return {
        taskDeposit: result.taskDeposit.toJSON(),
        currentTokens,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
