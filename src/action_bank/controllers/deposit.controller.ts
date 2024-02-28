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
import { DepositService } from '@/src/action_bank/services/deposit.service';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { Deposit } from '@/src/models/action_bank/deposit';
import { commonErrorHandler } from '@/src/utils/common_error_handler';
import { isRecord, isString } from '@/src/utils/type_guards';
import { InvalidInputError } from '@/src/errors';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/action_bank' })
export class DepositController {
  constructor(
    @Inject('DEPOSIT_SERVICE')
    private readonly depositService: DepositService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('deposits')
  async getDeposits(@Req() request: Request): Promise<Deposit[]> {
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

      return await this.depositService.getDeposits({
        page,
        pagination,
        userId,
        startDate,
        endDate,
        depositConversionId,
      });
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addDeposit')
  async addDeposit(@Req() request: Request): Promise<Deposit> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Body');
      }

      const newDeposit = Deposit.fromJSON(body.deposit);

      return await this.depositService.addDeposit(newDeposit);
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateDeposit')
  async updateDeposit(@Req() request: Request): Promise<Deposit> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Body');
      }

      const updatedDeposit = Deposit.fromJSON(body.deposit);

      return await this.depositService.updateDeposit(updatedDeposit);
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteDeposit')
  async deleteDeposit(@Req() request: Request): Promise<Deposit> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.depositId)) {
        throw new InvalidInputError('Invalid Deposit Id');
      }

      return await this.depositService.deleteDeposit(body.depositId);
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
