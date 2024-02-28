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
import { PurchasePricesService } from '@/src/action_bank/services/purchase_prices.service';
import { commonErrorHandler } from '@/src/utils/common_error_handler';
import { PurchasePrice } from '@/src/models/action_bank/purchase_price';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { isRecord, isString } from '@/src/utils/type_guards';
import { InvalidInputError } from '@/src/errors';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/action_bank' })
export class PurchasePricesController {
  constructor(
    @Inject('PURCHASE_PRICES_SERVICE')
    private readonly purchasePricesService: PurchasePricesService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('purchasePrices')
  async getPurchasePrices(@Req() request: Request): Promise<PurchasePrice[]> {
    const { page, pagination } = pageAndPagination(request);

    const userId = request.params?.userId;

    try {
      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      return this.purchasePricesService.getPurchasePrices({
        page,
        pagination,
        userId,
      });
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addPurchasePrice')
  async addPurchasePrice(@Req() request: Request): Promise<PurchasePrice> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Purchase Price input');
      }

      const purchasePrice = PurchasePrice.fromJSON(body.purchasePrice);

      return this.purchasePricesService.addPurchasePrice(purchasePrice);
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updatePurchasePrice')
  async updatePurchasePrice(@Req() request: Request): Promise<PurchasePrice> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid input');
      }

      const purchasePrice = PurchasePrice.fromJSON(body.purchasePrice);

      return this.purchasePricesService.updatePurchasePrice(purchasePrice);
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deletePurchasePrice')
  async deletePurchasePrice(@Req() request: Request): Promise<PurchasePrice> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.purchasePriceId)) {
        throw new InvalidInputError('Invalid Purchase Price Input');
      }

      return this.purchasePricesService.deletePurchasePrice(
        body.purchasePriceId,
      );
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
