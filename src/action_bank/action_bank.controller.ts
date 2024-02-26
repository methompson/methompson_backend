import { Controller, Get, Inject, Req, UseInterceptors } from '@nestjs/common';
import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { ActionBankService } from './services/action_bank.service';
import { LoggerService } from '@/src/logger/logger.service';
import { Request } from 'express';
import { UnimplementedError } from '@/src/errors';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/action_bank' })
export class ActionBankController {
  constructor(
    @Inject('ACTION_BANK_SERVICE')
    private readonly actionBankService: ActionBankService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  async getActionBankUsers(@Req() request: Request) {
    throw new UnimplementedError();
  }

  @Get()
  async getDepositConversions(@Req() request: Request) {}

  @Get()
  async getPurchasePrices(@Req() request: Request) {}

  @Get()
  async getDeposits(@Req() request: Request) {}

  @Get()
  async getPurchases(@Req() request: Request) {}
}
