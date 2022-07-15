import { Injectable } from '@nestjs/common';
import { LoggerService } from '@/src/logger/logger.service';

@Injectable()
export class LoggerConsoleService implements LoggerService {
  async addRequestLog() {
    console.log('addRequestLog');
  }

  async addLog() {
    console.log('addLog');
  }

  async addErrorLog() {
    console.error('addErrorLog');
  }

  async addWarningLog() {
    console.warn('addWarningLog');
  }
}
