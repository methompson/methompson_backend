import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  async addLog() {
    console.log('Adding Log');
  }
}
