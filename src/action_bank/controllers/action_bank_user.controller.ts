import {
  Controller,
  Get,
  Inject,
  Req,
  UseInterceptors,
  HttpStatus,
  HttpException,
  Post,
} from '@nestjs/common';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { ActionBankUserService } from '@/src/action_bank/services/action_bank_user.service';
import { LoggerService } from '@/src/logger/logger.service';
import { Request } from 'express';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { ActionBankUserJSON } from '@/src/models/action_bank/action_bank_user';
import { isNullOrUndefined } from '@/src/utils/type_guards';
import { NotFoundError, UnimplementedError } from '@/src/errors';

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
  async getUsers(@Req() request: Request): Promise<ActionBankUserJSON[]> {
    const { page, pagination } = pageAndPagination(request);

    try {
      return this.actionBankUserService.getActionBankUsers({
        page,
        pagination,
      });
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new HttpException('No User Found', HttpStatus.NOT_FOUND);
      }
      await this.loggerService.addErrorLog(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('user/:userId')
  async getUser(@Req() request: Request): Promise<ActionBankUserJSON> {
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
        throw new Error(`User with ID ${userId} not found`);
      }

      return user;
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new HttpException('No User Found', HttpStatus.NOT_FOUND);
      }
      await this.loggerService.addErrorLog(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('addUser')
  async addUser(@Req() request: Request): Promise<ActionBankUserJSON> {
    throw new UnimplementedError('Not Implemented');
  }

  @Post('updateUser')
  async updateUser(@Req() request: Request): Promise<ActionBankUserJSON> {
    throw new UnimplementedError('Not Implemented');
  }

  @Post('deleteUser')
  async deleteUser(@Req() request: Request): Promise<ActionBankUserJSON> {
    throw new UnimplementedError('Not Implemented');
  }
}
