import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export abstract class LoggerService {
  abstract addRequestLog(req: Request): Promise<void>;

  abstract addLog(msg: unknown): Promise<void>;

  abstract addErrorLog(msg: unknown): Promise<void>;

  abstract addWarningLog(msg: unknown): Promise<void>;
}
