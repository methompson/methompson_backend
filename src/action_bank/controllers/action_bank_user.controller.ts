import {
  Controller,
  Get,
  Inject,
  Req,
  UseInterceptors,
  Post,
} from '@nestjs/common';
import { Request } from 'express';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { ActionBankUserService } from '@/src/action_bank/services/action_bank_user.service';
import { LoggerService } from '@/src/logger/logger.service';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { ActionBankUser } from '@/src/models/action_bank/action_bank_user';
import { isNullOrUndefined, isRecord, isString } from '@/src/utils/type_guards';
import { InvalidInputError, NotFoundError } from '@/src/errors';
import { AuthRequiredIncerceptor } from '@/src/middleware/auth_interceptor';
import { commonErrorHandler } from '@/src/utils/common_error_handler';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/action_bank' })
export class ActionBankUserController {
  constructor(
    @Inject('ACTION_BANK_USER_SERVICE')
    private readonly actionBankUserService: ActionBankUserService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('users')
  @UseInterceptors(AuthRequiredIncerceptor)
  async getUsers(@Req() request: Request): Promise<ActionBankUser[]> {
    const { page, pagination } = pageAndPagination(request);

    try {
      return await this.actionBankUserService.getActionBankUsers({
        page,
        pagination,
      });
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Get('user/:userId')
  @UseInterceptors(AuthRequiredIncerceptor)
  async getUser(@Req() request: Request): Promise<ActionBankUser> {
    const userId = request.params?.userId;

    try {
      const users = await this.actionBankUserService.getActionBankUsers({
        userId,
      });

      if (users.length > 1) {
        throw new Error('More than one user found');
      }

      const user = users[0];

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      return user;
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addUser')
  @UseInterceptors(AuthRequiredIncerceptor)
  async addUser(@Req() request: Request): Promise<ActionBankUser> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid User Input');
      }

      const newUser = ActionBankUser.fromJSON(body.user);
      const user = await this.actionBankUserService.addActionBankUser(newUser);

      return user;
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateUser')
  @UseInterceptors(AuthRequiredIncerceptor)
  async updateUser(@Req() request: Request): Promise<ActionBankUser> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid User Input');
      }

      const newUser = ActionBankUser.fromJSON(body.user);
      const user = await this.actionBankUserService.updateActionBankUser(
        newUser,
      );
      return user;
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteUser')
  @UseInterceptors(AuthRequiredIncerceptor)
  async deleteUser(@Req() request: Request): Promise<ActionBankUser> {
    try {
      const userId = request.body?.userId;

      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User ID');
      }

      const user = await this.actionBankUserService.deleteActionBankUser(
        userId,
      );

      return user;
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
