import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { LoggerService } from '@/src/logger/logger.console.service';

@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  constructor(private readonly loggerSerivce: LoggerService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    console.log('Requesting');
    this.loggerSerivce.addRequestLog();
    next();
  }
}
