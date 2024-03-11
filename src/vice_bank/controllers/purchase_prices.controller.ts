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
import { PurchasePricesService } from '@/src/vice_bank/services/purchase_prices.service';
import { commonErrorHandler } from '@/src/utils/common_error_handler';
import { PurchasePrice } from '@/src/models/vice_bank/purchase_price';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { isRecord, isString } from '@/src/utils/type_guards';
import { InvalidInputError } from '@/src/errors';

interface GetPurchasePricesResponse {
  purchasePrices: PurchasePrice[];
}
interface AddPurchasePriceResponse {
  purchasePrice: PurchasePrice;
}
interface UpdatePurchasePriceResponse {
  purchasePrice: PurchasePrice;
}
interface DeletePurchasePriceResponse {
  purchasePrice: PurchasePrice;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/vice_bank' })
export class PurchasePricesController {
  constructor(
    @Inject('PURCHASE_PRICES_SERVICE')
    private readonly purchasePricesService: PurchasePricesService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('purchasePrices')
  async getPurchasePrices(
    @Req() request: Request,
  ): Promise<GetPurchasePricesResponse> {
    const { page, pagination } = pageAndPagination(request);

    const userId = request.query?.userId;

    try {
      if (!isString(userId)) {
        throw new InvalidInputError('Invalid User Id');
      }

      const res = await this.purchasePricesService.getPurchasePrices({
        page,
        pagination,
        userId,
      });

      return { purchasePrices: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addPurchasePrice')
  async addPurchasePrice(
    @Req() request: Request,
  ): Promise<AddPurchasePriceResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Purchase Price input');
      }

      const purchasePrice = PurchasePrice.fromJSON(body.purchasePrice);

      const res = await this.purchasePricesService.addPurchasePrice(
        purchasePrice,
      );

      return { purchasePrice: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updatePurchasePrice')
  async updatePurchasePrice(
    @Req() request: Request,
  ): Promise<UpdatePurchasePriceResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid input');
      }

      const purchasePrice = PurchasePrice.fromJSON(body.purchasePrice);

      const res = await this.purchasePricesService.updatePurchasePrice(
        purchasePrice,
      );

      return { purchasePrice: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deletePurchasePrice')
  async deletePurchasePrice(
    @Req() request: Request,
  ): Promise<DeletePurchasePriceResponse> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.purchasePriceId)) {
        throw new InvalidInputError('Invalid Purchase Price Input');
      }

      const res = await this.purchasePricesService.deletePurchasePrice(
        body.purchasePriceId,
      );

      return { purchasePrice: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
