import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { LoggerService } from '@/src/logger/logger.service';
import { FileDataService } from '@/src/file/file_data.service';
import { getBackupFrequency } from '@/src/utils/cron_backup_frequency';

@Injectable()
export class FileBackupService {
  constructor(
    @Inject('LOGGER_SERVICE') protected readonly loggerService: LoggerService,
    @Inject('FILE_SERVICE') protected readonly fileDataService: FileDataService,
  ) {}

  // @Cron('0 * * * * *')
  @Cron(getBackupFrequency())
  async handleCron() {
    console.log('Backing up File Data');

    try {
      await this.fileDataService.backup();
    } catch (e) {
      this.loggerService.addErrorLog(`Error backing up file data: ${e}`);
    }
  }
}
