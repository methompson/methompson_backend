import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class LoggerService {
  abstract addRequestLog(): Promise<void>;

  abstract addLog(): Promise<void>;

  abstract addErrorLog(): Promise<void>;

  abstract addWarningLog(): Promise<void>;
}
