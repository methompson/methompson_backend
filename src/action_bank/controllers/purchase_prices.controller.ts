import { Controller, Inject, UseInterceptors } from '@nestjs/common';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { LoggerService } from '@/src/logger/logger.service';
import { PurchasePricesService } from '@/src/action_bank/services/purchase_prices.service';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/action_bank' })
export class PurchasePricesController {
  constructor(
    @Inject('PURCHASE_PRICES_SERVICE')
    private readonly purchasePricesService: PurchasePricesService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}
}
