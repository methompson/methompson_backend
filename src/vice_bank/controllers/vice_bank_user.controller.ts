import {
  Controller,
  Get,
  Inject,
  Req,
  UseInterceptors,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { ViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service';
import { LoggerService } from '@/src/logger/logger.service';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { ViceBankUser } from '@/src/models/vice_bank/vice_bank_user';
import { isNullOrUndefined, isRecord, isString } from '@/src/utils/type_guards';
import { InvalidInputError, NotFoundError } from '@/src/errors';
import { AuthRequiredIncerceptor } from '@/src/middleware/auth_interceptor';
import { commonErrorHandler } from '@/src/utils/common_error_handler';
import type { METIncomingMessage } from '@/src/utils/met_incoming_message';

interface GetUsersResponse {
  users: ViceBankUser[];
}

interface GetUserResponse {
  user: ViceBankUser;
}

interface AddUserResponse {
  user: ViceBankUser;
}

interface UpdateUserResponse {
  user: ViceBankUser;
}

interface DeleteUserResponse {
  user: ViceBankUser;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/vice_bank' })
export class ViceBankUserController {
  constructor(
    @Inject('VICE_BANK_USER_SERVICE')
    private readonly viceBankUserService: ViceBankUserService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('users')
  @UseInterceptors(AuthRequiredIncerceptor)
  async getUsers(
    @Req() request: METIncomingMessage,
  ): Promise<GetUsersResponse> {
    const { page, pagination } = pageAndPagination(request);

    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const users = await this.viceBankUserService.getViceBankUsers(
        auth.userId,
        {
          page,
          pagination,
        },
      );

      return { users };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Get('user/:userId')
  @UseInterceptors(AuthRequiredIncerceptor)
  async getUser(@Req() request: METIncomingMessage): Promise<GetUserResponse> {
    const userId = request.params?.userId;

    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const users = await this.viceBankUserService.getViceBankUsers(
        auth.userId,
        {
          userId,
        },
      );

      if (users.length > 1) {
        throw new Error('More than one user found');
      }

      const user = users[0];

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      return { user };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addUser')
  @UseInterceptors(AuthRequiredIncerceptor)
  async addUser(@Req() request: METIncomingMessage): Promise<AddUserResponse> {
    try {
      const auth = request.authModel;
      const { body } = request;

      if (!isRecord(body) || !isRecord(body.user)) {
        throw new InvalidInputError('Invalid User Input');
      }

      const newUser = ViceBankUser.fromJSON({
        ...body.user,
        userId: auth?.userId,
      });
      const user = await this.viceBankUserService.addViceBankUser(newUser);

      return { user };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateUser')
  @UseInterceptors(AuthRequiredIncerceptor)
  async updateUser(@Req() request: Request): Promise<UpdateUserResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid User Input');
      }

      const updatedUser = ViceBankUser.fromJSON(body.user);
      const user = await this.viceBankUserService.updateViceBankUser(
        updatedUser,
      );

      return { user };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteUser')
  @UseInterceptors(AuthRequiredIncerceptor)
  async deleteUser(
    @Req() request: METIncomingMessage,
  ): Promise<DeleteUserResponse> {
    // TODO clear all deposits, conversions, purchases and prices for the user
    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const { body } = request;

      if (!isRecord(body) || !isString(body.viceBankUserId)) {
        throw new InvalidInputError('Invalid User ID');
      }

      const user = await this.viceBankUserService.deleteViceBankUser(
        auth.userId,
        body.viceBankUserId,
      );

      return { user };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
