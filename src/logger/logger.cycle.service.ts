import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { LoggerService } from '@/src/logger/logger.service';

@Injectable()
export class LoggerCycleService {
  constructor(
    @Inject('LOGGER_SERVICE') protected readonly loggerService: LoggerService,
  ) {}

  @Cron('0 0 * * * *')
  async handleCron() {
    console.log('Cycling Logs');

    await this.loggerService.cycleLogs();
  }
}
