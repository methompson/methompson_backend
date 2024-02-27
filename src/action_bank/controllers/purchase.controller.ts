import { Controller, Inject, UseInterceptors } from '@nestjs/common';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { LoggerService } from '@/src/logger/logger.service';
import { PurchaseService } from '@/src/action_bank/services/purchase.service';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/action_bank' })
export class PurchaseController {
  constructor(
    @Inject('PURCHASE_SERVICE')
    private readonly purchesService: PurchaseService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}
}
