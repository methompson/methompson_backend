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
import { DepositConversionsService } from '@/src/vice_bank/services/deposit_conversions.service';
import { DepositConversion } from '@/src/models/vice_bank/deposit_conversion';
import { InvalidInputError } from '@/src/errors';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { isRecord, isString } from '@/src/utils/type_guards';
import { commonErrorHandler } from '@/src/utils/common_error_handler';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/action_bank' })
export class DepositConversionsController {
  constructor(
    @Inject('DEPOSIT_CONVERSIONS_SERVICE')
    private readonly depositConversionsService: DepositConversionsService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('depositConversions')
  async getDepositConversions(
    @Req() request: Request,
  ): Promise<DepositConversion[]> {
    const { page, pagination } = pageAndPagination(request);

    const userId = request.query?.userId;

    try {
      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      return await this.depositConversionsService.getDepositConversions({
        page,
        pagination,
        userId,
      });
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addDepositConversion')
  async addDepositConversion(
    @Req() request: Request,
  ): Promise<DepositConversion> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Deposit Conversion Input');
      }

      const depositConversion = DepositConversion.fromJSON(
        body.depositConversion,
      );

      return await this.depositConversionsService.addDepositConversion(
        depositConversion,
      );
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateDepositConversion')
  async updateDepositConversion(
    @Req() request: Request,
  ): Promise<DepositConversion> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Deposit Conversion Input');
      }

      const depositConversion = DepositConversion.fromJSON(
        body.depositConversion,
      );

      return await this.depositConversionsService.updateDepositConversion(
        depositConversion,
      );
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('delete_deposit_conversion')
  async deleteDepositConversion(
    @Req() request: Request,
  ): Promise<DepositConversion> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.depositConversionId)) {
        throw new InvalidInputError('Invalid Deposit Conversion Input');
      }

      return await this.depositConversionsService.deleteDepositConversion(
        body.depositConversionId,
      );
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
