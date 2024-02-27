import { Controller, Inject, UseInterceptors } from '@nestjs/common';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { LoggerService } from '@/src/logger/logger.service';
import { DepositConversionsService } from '@/src/action_bank/services/deposit_conversions.service';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/action_bank' })
export class DepositConversionsController {
  constructor(
    @Inject('DEPOSIT_CONVERSIONS_SERVICE')
    private readonly depositConversionsService: DepositConversionsService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}
}
