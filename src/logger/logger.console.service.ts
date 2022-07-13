import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
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
