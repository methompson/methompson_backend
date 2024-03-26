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
import { PurchaseService } from '@/src/vice_bank/services/purchase.service';
import { ViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service';
import { pageAndPagination } from '@/src/utils/page_and_pagination';
import { Purchase, PurchaseJSON } from '@/src/models/vice_bank/purchase';
import { InvalidInputError, NotFoundError } from '@/src/errors';
import { isNullOrUndefined, isRecord, isString } from '@/src/utils/type_guards';
import { commonErrorHandler } from '@/src/utils/common_error_handler';
import { type METIncomingMessage } from '@/src/utils/met_incoming_message';
import {
  PurchasePrice,
  PurchasePriceJSON,
} from '@/src/models/vice_bank/purchase_price';

interface GetPurchasesResponse {
  purchases: PurchaseJSON[];
}
interface AddPurchaseResponse {
  purchase: PurchaseJSON;
  currentTokens: number;
}
interface UpdatePurchaseResponse {
  purchase: PurchaseJSON;
  oldPurchase: PurchaseJSON;
  currentTokens: number;
}
interface DeletePurchaseResponse {
  purchase: PurchaseJSON;
  currentTokens: number;
}

interface GetPurchasePricesResponse {
  purchasePrices: PurchasePriceJSON[];
}
interface AddPurchasePriceResponse {
  purchasePrice: PurchasePriceJSON;
}
interface UpdatePurchasePriceResponse {
  purchasePrice: PurchasePriceJSON;
}
interface DeletePurchasePriceResponse {
  purchasePrice: PurchasePriceJSON;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/vice_bank' })
export class PurchaseController {
  constructor(
    @Inject('PURCHASE_SERVICE')
    private readonly purchasesService: PurchaseService,
    @Inject('VICE_BANK_USER_SERVICE')
    private readonly viceBankUserService: ViceBankUserService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get('purchases')
  async getPurchases(@Req() request: Request): Promise<GetPurchasesResponse> {
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

      const purchases = (
        await this.purchasesService.getPurchases({
          page,
          pagination,
          userId,
          startDate,
          endDate,
          purchasePriceId,
        })
      ).map((purchase) => purchase.toJSON());

      return { purchases };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('addPurchase')
  async addPurchase(
    @Req() request: METIncomingMessage,
  ): Promise<AddPurchaseResponse> {
    try {
      const auth = request.authModel;

      if (isNullOrUndefined(auth)) {
        throw new UnauthorizedException('Auth Model Not Found in Request');
      }

      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Purchase Body');
      }

      const newPurchase = Purchase.fromJSON(body.purchase);

      const user = await this.viceBankUserService.getViceBankUser(
        newPurchase.vbUserId,
      );

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(
          `User with ID ${newPurchase.vbUserId} not found`,
        );
      }

      const currentTokens = user.currentTokens - newPurchase.purchasedQuantity;

      if (currentTokens < 0) {
        throw new InvalidInputError('Not enough tokens');
      }

      const userToUpdate = user.copyWith({
        currentTokens: user.currentTokens - newPurchase.purchasedQuantity,
      });

      const [purchase] = await Promise.all([
        this.purchasesService.addPurchase(newPurchase),
        this.viceBankUserService.updateViceBankUser(userToUpdate),
      ]);

      // const res = await this.purchesService.addPurchase(newPurchase);

      return {
        purchase: purchase.toJSON(),
        currentTokens: userToUpdate.currentTokens,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('updatePurchase')
  async updatePurchase(
    @Req() request: Request,
  ): Promise<UpdatePurchaseResponse> {
    try {
      const { body } = request;

      if (!isRecord(body)) {
        throw new InvalidInputError('Invalid Purchase Body');
      }

      const purchaseToUpdate = Purchase.fromJSON(body.purchase);

      const [price, user] = await Promise.all([
        this.purchasesService.getPurchasePrice(
          purchaseToUpdate.purchasePriceId,
        ),
        this.viceBankUserService.getViceBankUser(purchaseToUpdate.vbUserId),
      ]);

      const res = await this.purchasesService.updatePurchase(purchaseToUpdate);

      const quantDif =
        purchaseToUpdate.purchasedQuantity - res.purchasedQuantity;
      const tokensDif = quantDif * price.price;

      const currentTokens = user.currentTokens + tokensDif;

      await this.viceBankUserService.updateViceBankUser(
        user.copyWith({ currentTokens }),
      );

      return {
        purchase: purchaseToUpdate.toJSON(),
        oldPurchase: res.toJSON(),
        currentTokens,
      };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

  @Post('deletePurchase')
  async deletePurchase(
    @Req() request: Request,
  ): Promise<DeletePurchaseResponse> {
    try {
      const { body } = request;

      if (!isRecord(body) || !isString(body.purchaseId)) {
        throw new InvalidInputError('Invalid Purchase Id');
      }

      const purchaseToDelete = await this.purchasesService.deletePurchase(
        body.purchaseId,
      );

      const [price, user] = await Promise.all([
        this.purchasesService.getPurchasePrice(
          purchaseToDelete.purchasePriceId,
        ),
        this.viceBankUserService.getViceBankUser(purchaseToDelete.vbUserId),
      ]);

      const tokenDif = purchaseToDelete.purchasedQuantity * price.price;
      const currentTokens = user.currentTokens + tokenDif;

      await this.viceBankUserService.updateViceBankUser(
        user.copyWith({ currentTokens }),
      );

      return { purchase: purchaseToDelete.toJSON(), currentTokens };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }

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

      const res = await this.purchasesService.getPurchasePrices({
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

      const res = await this.purchasesService.addPurchasePrice(purchasePrice);

      return { purchasePrice: res.toJSON() };
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

      const res = await this.purchasesService.updatePurchasePrice(
        purchasePrice,
      );

      return { purchasePrice: res.toJSON() };
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

      const res = await this.purchasesService.deletePurchasePrice(
        body.purchasePriceId,
      );

      return { purchasePrice: res.toJSON() };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
