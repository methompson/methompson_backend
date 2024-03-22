import {
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { LoggerService } from '@/src/logger/logger.service';
import { ActionService } from '@/src/vice_bank/services/action.service';
import { Action } from '@/src/models/vice_bank/action';
import { InvalidInputError } from '@/src/errors';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { isRecord, isString } from '@/src/utils/type_guards';
import { commonErrorHandler } from '@/src/utils/common_error_handler';

interface GetActionResponse {
  actions: Action[];
}
interface AddActionResponse {
  action: Action;
}
interface UpdateActionResponse {
  action: Action;
}
interface DeleteActionResponse {
  action: Action;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/vice_bank' })
export class ActionController {
  constructor(
    @Inject('ACTION_SERVICE')
    private readonly actionService: ActionService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('actions')
  async getActions(@Req() request: Request): Promise<GetActionResponse> {
    const { page, pagination } = pageAndPagination(request);

    const userId = request.query?.userId;

    try {
      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      const actions = await this.actionService.getActions({
        page,
        pagination,
        userId,
      });

      return { actions };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addAction')
  async addAction(@Req() request: Request): Promise<AddActionResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Deposit Conversion Input');
      }

      const action = Action.fromJSON(body.action);

      const res = await this.actionService.addAction(action);

      return { action: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateAction')
  async updateAction(@Req() request: Request): Promise<UpdateActionResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Deposit Conversion Input');
      }

      const action = Action.fromJSON(body.action);

      const res = await this.actionService.updateAction(action);

      return { action: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteAction')
  async deleteAction(@Req() request: Request): Promise<DeleteActionResponse> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.actionId)) {
        throw new InvalidInputError('Invalid Deposit Conversion Input');
      }

      const res = await this.actionService.deleteAction(body.actionId);

      return { action: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
