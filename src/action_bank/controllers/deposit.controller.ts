import { Controller, Inject, UseInterceptors } from '@nestjs/common';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { LoggerService } from '@/src/logger/logger.service';
import { DepositService } from '@/src/action_bank/services/deposit.service';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/action_bank' })
export class DepositController {
  constructor(
    @Inject('DEPOSIT_SERVICE')
    private readonly depositService: DepositService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}
}
