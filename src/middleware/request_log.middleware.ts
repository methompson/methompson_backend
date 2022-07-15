import { Injectable, Inject, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { LoggerService } from '@/src/logger/logger.service';

@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  constructor(
    @Inject('LOGGER_SERVICE') private readonly loggerSerivce: LoggerService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    this.loggerSerivce.addRequestLog();
    next();
  }
}
