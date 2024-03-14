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
import { Purchase } from '@/src/models/vice_bank/purchase';
import { InvalidInputError, NotFoundError } from '@/src/errors';
import { isNullOrUndefined, isRecord, isString } from '@/src/utils/type_guards';
import { commonErrorHandler } from '@/src/utils/common_error_handler';
import { type METIncomingMessage } from '@/src/utils/met_incoming_message';

interface GetPurchasesResponse {
  purchases: Purchase[];
}
interface AddPurchaseResponse {
  purchase: Purchase;
  currentTokens: number;
}
interface UpdatePurchaseResponse {
  purchase: Purchase;
}
interface DeletePurchaseResponse {
  purchase: Purchase;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/vice_bank' })
export class PurchaseController {
  constructor(
    @Inject('PURCHASE_SERVICE')
    private readonly purchesService: PurchaseService,
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

      const purchases = await this.purchesService.getPurchases({
        page,
        pagination,
        userId,
        startDate,
        endDate,
        purchasePriceId,
      });

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

      const users = await this.viceBankUserService.getViceBankUsers(
        auth.userId,
        { userId: newPurchase.vbUserId },
      );

      const user = users[0];
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
        this.purchesService.addPurchase(newPurchase),
        this.viceBankUserService.updateViceBankUser(userToUpdate),
      ]);

      // const res = await this.purchesService.addPurchase(newPurchase);

      return { purchase, currentTokens: userToUpdate.currentTokens };
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

      const purchase = Purchase.fromJSON(body.purchase);

      const res = await this.purchesService.updatePurchase(purchase);

      return { purchase: res };
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

      const res = await this.purchesService.deletePurchase(body.purchaseId);

      return { purchase: res };
    } catch (e) {
      throw await commonErrorHandler(e, this.loggerService);
    }
  }
}
