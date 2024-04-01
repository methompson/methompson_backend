import {
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { LoggerService } from '@/src/logger/logger.service';
import { InvalidInputError, NotFoundError } from '@/src/errors';

import { commonErrorHandler } from '@/src/utils/common_error_handler';
import { type METIncomingMessage } from '@/src/utils/met_incoming_message';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { isNullOrUndefined, isRecord, isString } from '@/src/utils/type_guards';

import { Action, ActionJSON } from '@/src/models/vice_bank/action';
import { Deposit, DepositJSON } from '@/src/models/vice_bank/deposit';
import { ActionService } from '@/src/vice_bank/services/action.service';
import { ViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service';

interface GetActionResponse {
  actions: ActionJSON[];
}
interface AddActionResponse {
  action: ActionJSON;
}
interface UpdateActionResponse {
  action: ActionJSON;
}
interface DeleteActionResponse {
  action: ActionJSON;
}

interface GetDepositsResponse {
  deposits: DepositJSON[];
}
interface AddDepositResponse {
  deposit: DepositJSON;
  currentTokens: number;
}
interface UpdateDepositResponse {
  deposit: DepositJSON;
  oldDeposit: DepositJSON;
  currentTokens: number;
}
interface DeleteDepositResponse {
  deposit: DepositJSON;
  currentTokens: number;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/vice_bank' })
export class ActionController {
  constructor(
    @Inject('ACTION_SERVICE')
    private readonly actionService: ActionService,
    @Inject('VICE_BANK_USER_SERVICE')
    private readonly viceBankUserService: ViceBankUserService,
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

      const actions = (
        await this.actionService.getActions({
          page,
          pagination,
          userId,
        })
      ).map((action) => action.toJSON());

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

      return { action: res.toJSON() };
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

      return { action: res.toJSON() };
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

      return { action: res.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Get('deposits')
  async getDeposits(@Req() request: Request): Promise<GetDepositsResponse> {
    const { page, pagination } = pageAndPagination(request);

    try {
      if (!isRecord(request.query)) {
        throw new InvalidInputError('Invalid Query');
      }

      let { startDate, endDate, depositConversionId } = request.query;
      const { userId } = request.query;

      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      startDate = isString(startDate) ? startDate : undefined;
      endDate = isString(endDate) ? endDate : undefined;
      depositConversionId = isString(depositConversionId)
        ? depositConversionId
        : undefined;

      const depositsResponse = await this.actionService.getDeposits({
        page,
        pagination,
        userId,
        startDate,
        endDate,
        depositConversionId,
      });

      const deposits = depositsResponse.map((deposit) => deposit.toJSON());

      return { deposits };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addDeposit')
  async addDeposit(
    @Req() request: METIncomingMessage,
  ): Promise<AddDepositResponse> {
    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Body');
      }

      // Here, we parse the raw deposit from the request body
      const rawDeposit = Deposit.fromJSON(body.deposit);

      // We get the users and action from the database
      const [user, action] = await Promise.all([
        this.viceBankUserService.getViceBankUser(rawDeposit.vbUserId),
        this.actionService.getAction(rawDeposit.actionId),
      ]);

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(
          `User with ID ${rawDeposit.vbUserId} not found`,
        );
      }

      if (isNullOrUndefined(action)) {
        throw new NotFoundError(
          `Action with ID ${rawDeposit.vbUserId} not found`,
        );
      }

      const newDeposit = rawDeposit.copyWith({
        actionId: action.id,
        actionName: action.name,
        conversionRate: action.conversionRate,
        tokensEarned: rawDeposit.depositQuantity * action.conversionRate,
      });

      const tokensEarned = newDeposit.tokensEarned;

      const userToUpdate = user.copyWith({
        currentTokens: user.currentTokens + tokensEarned,
      });

      const [response] = await Promise.all([
        this.actionService.addDeposit(newDeposit),
        this.viceBankUserService.updateViceBankUser(userToUpdate),
      ]);

      // const deposit = await this.actionService.addDeposit(newDeposit);

      return {
        deposit: response.deposit.toJSON(),
        currentTokens: userToUpdate.currentTokens,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateDeposit')
  async updateDeposit(@Req() request: Request): Promise<UpdateDepositResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Body');
      }

      // Here, we parse the raw deposit from the request body
      const rawDeposit = Deposit.fromJSON(body.deposit);

      // We get the users and action from the database
      const [user, action] = await Promise.all([
        this.viceBankUserService.getViceBankUser(rawDeposit.vbUserId),
        this.actionService.getAction(rawDeposit.actionId),
      ]);

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(
          `User with ID ${rawDeposit.vbUserId} not found`,
        );
      }

      if (isNullOrUndefined(action)) {
        throw new NotFoundError(
          `Action with ID ${rawDeposit.vbUserId} not found`,
        );
      }

      const updatedDeposit = rawDeposit.copyWith({
        actionId: action.id,
        actionName: action.name,
        conversionRate: action.conversionRate,
        tokensEarned: rawDeposit.depositQuantity * action.conversionRate,
      });

      const response = await this.actionService.updateDeposit(updatedDeposit);

      const tokensEarned =
        updatedDeposit.tokensEarned - response.deposit.tokensEarned;

      const userToUpdate = user.copyWith({
        currentTokens: user.currentTokens + tokensEarned,
      });

      await this.viceBankUserService.updateViceBankUser(userToUpdate);

      return {
        deposit: updatedDeposit.toJSON(),
        oldDeposit: response.deposit.toJSON(),
        currentTokens: userToUpdate.currentTokens,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteDeposit')
  async deleteDeposit(@Req() request: Request): Promise<DeleteDepositResponse> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.depositId)) {
        throw new InvalidInputError('Invalid Deposit Id');
      }

      const response = await this.actionService.deleteDeposit(body.depositId);

      const user = await this.viceBankUserService.getViceBankUser(
        response.deposit.vbUserId,
      );

      const userToUpdate = user.copyWith({
        currentTokens: user.currentTokens + response.tokensAdded,
      });

      await this.viceBankUserService.updateViceBankUser(userToUpdate);

      return {
        deposit: response.deposit.toJSON(),
        currentTokens: userToUpdate.currentTokens,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
