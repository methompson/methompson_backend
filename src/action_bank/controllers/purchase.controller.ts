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
import { PurchaseService } from '@/src/action_bank/services/purchase.service';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { Purchase } from '@/src/models/action_bank/purchase';
import { InvalidInputError } from '@/src/errors';
import { isRecord, isString } from '@/src/utils/type_guards';
import { commonErrorHandler } from '@/src/utils/common_error_handler';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/action_bank' })
export class PurchaseController {
  constructor(
    @Inject('PURCHASE_SERVICE')
    private readonly purchesService: PurchaseService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('purchases')
  async getPurchases(@Req() request: Request): Promise<Purchase[]> {
    const { page, pagination } = pageAndPagination(request);

    try {
      const { userId } = request.query;
      let { startDate, endDate, purchasePriceId } = request.query;

      startDate = isString(startDate) ? startDate : undefined;
      endDate = isString(endDate) ? endDate : undefined;
      purchasePriceId = isString(purchasePriceId) ? purchasePriceId : undefined;

      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      return await this.purchesService.getPurchases({
        page,
        pagination,
        userId,
        startDate,
        endDate,
        purchasePriceId,
      });
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addPurchase')
  async addPurchase(@Req() request: Request): Promise<Purchase> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Purchase Body');
      }

      const purchase = Purchase.fromJSON(body.purchase);

      return await this.purchesService.addPurchase(purchase);
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updatePurchase')
  async updatePurchase(@Req() request: Request): Promise<Purchase> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Purchase Body');
      }

      const purchase = Purchase.fromJSON(body.purchase);

      return await this.purchesService.updatePurchase(purchase);
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deletePurchase')
  async deletePurchase(@Req() request: Request): Promise<Purchase> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.purchaseId)) {
        throw new InvalidInputError('Invalid Purchase Id');
      }

      return await this.purchesService.deletePurchase(body.purchaseId);
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
