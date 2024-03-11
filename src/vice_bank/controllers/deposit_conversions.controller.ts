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

interface GetDepositConversionsResponse {
  depositConversions: DepositConversion[];
}
interface AddDepositConversionResponse {
  depositConversion: DepositConversion;
}
interface UpdateDepositConversionResponse {
  depositConversion: DepositConversion;
}
interface DeleteDepositConversionResponse {
  depositConversion: DepositConversion;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/vice_bank' })
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
  ): Promise<GetDepositConversionsResponse> {
    const { page, pagination } = pageAndPagination(request);

    const userId = request.query?.userId;

    try {
      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      const depositConversions =
        await this.depositConversionsService.getDepositConversions({
          page,
          pagination,
          userId,
        });

      return { depositConversions };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addDepositConversion')
  async addDepositConversion(
    @Req() request: Request,
  ): Promise<AddDepositConversionResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Deposit Conversion Input');
      }

      const depositConversion = DepositConversion.fromJSON(
        body.depositConversion,
      );

      const res = await this.depositConversionsService.addDepositConversion(
        depositConversion,
      );

      return { depositConversion: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updateDepositConversion')
  async updateDepositConversion(
    @Req() request: Request,
  ): Promise<UpdateDepositConversionResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Deposit Conversion Input');
      }

      const depositConversion = DepositConversion.fromJSON(
        body.depositConversion,
      );

      const res = await this.depositConversionsService.updateDepositConversion(
        depositConversion,
      );

      return { depositConversion: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deleteDepositConversion')
  async deleteDepositConversion(
    @Req() request: Request,
  ): Promise<DeleteDepositConversionResponse> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.depositConversionId)) {
        throw new InvalidInputError('Invalid Deposit Conversion Input');
      }

      const res = await this.depositConversionsService.deleteDepositConversion(
        body.depositConversionId,
      );

      return { depositConversion: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
