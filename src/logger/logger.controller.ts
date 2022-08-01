import { Request } from 'express';

export abstract class LoggerController {
  abstract addRequestLog(req: Request): Promise<void>;

  abstract addLog(msg: unknown): Promise<void>;

  abstract addErrorLog(msg: unknown): Promise<void>;

  abstract addWarningLog(msg: unknown): Promise<void>;
}
