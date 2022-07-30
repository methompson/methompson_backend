import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { LoggerService } from '@/src/logger/logger.service';

@Injectable()
export class LoggerConsoleService implements LoggerService {
  get isoTime() {
    return new Date().toISOString();
  }

  async addRequestLog(req: Request) {
    const requestType = req.method;
    const path = req.path;
    const remoteAddress =
      req.header['x-forwarded-for'] ?? req.socket.remoteAddress;

    console.log(
      `${this.isoTime} - ${remoteAddress} - ${requestType} - ${path}`,
    );
  }

  async addLog(msg: unknown) {
    console.log(`${this.isoTime} - addLog - ${msg}`);
  }

  async addErrorLog(msg: unknown) {
    console.error(`${this.isoTime} - addErrorLog - ${msg}`);
  }

  async addWarningLog(msg: unknown) {
    console.warn(`${this.isoTime} - addWarningLog - ${msg}`);
  }
}
