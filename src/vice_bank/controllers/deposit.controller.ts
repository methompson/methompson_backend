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
import { DepositService } from '@/src/vice_bank/services/deposit.service';
import { ViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { Deposit } from '@/src/models/vice_bank/deposit';
import { commonErrorHandler } from '@/src/utils/common_error_handler';
import { isNullOrUndefined, isRecord, isString } from '@/src/utils/type_guards';
import { InvalidInputError, NotFoundError } from '@/src/errors';
import { type METIncomingMessage } from '@/src/utils/met_incoming_message';

interface GetDepositsResponse {
  deposits: Deposit[];
}
interface AddDepositResponse {
  deposit: Deposit;
  currentTokens: number;
}
interface UpdateDepositResponse {
  deposit: Deposit;
}
interface DeleteDepositResponse {
  deposit: Deposit;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/vice_bank' })
export class DepositController {
  constructor(
    @Inject('DEPOSIT_SERVICE')
    private readonly depositService: DepositService,
    @Inject('VICE_BANK_USER_SERVICE')
    private readonly viceBankUserService: ViceBankUserService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

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

      const deposits = await this.depositService.getDeposits({
        page,
        pagination,
        userId,
        startDate,
        endDate,
        depositConversionId,
      });

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

      const newDeposit = Deposit.fromJSON(body.deposit);

      const users = await this.viceBankUserService.getViceBankUsers(
        auth.userId,
        { userId: newDeposit.vbUserId },
      );

      const user = users[0];
      if (isNullOrUndefined(user)) {
        throw new NotFoundError(
          `User with ID ${newDeposit.vbUserId} not found`,
        );
      }

      const tokensEarned = newDeposit.tokensEarned;

      const userToUpdate = user.copyWith({
        currentTokens: user.currentTokens + tokensEarned,
      });

      const [deposit] = await Promise.all([
        this.depositService.addDeposit(newDeposit),
        this.viceBankUserService.updateViceBankUser(userToUpdate),
      ]);

      // const deposit = await this.depositService.addDeposit(newDeposit);

      return { deposit, currentTokens: userToUpdate.currentTokens };
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

      const updatedDeposit = Deposit.fromJSON(body.deposit);

      const deposit = await this.depositService.updateDeposit(updatedDeposit);
      return { deposit };
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

      const deposit = await this.depositService.deleteDeposit(body.depositId);
      return { deposit };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
