import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { LoggerService } from '@/src/logger/logger.service';
import { BlogService } from '@/src/blog/blog.service';
import { getBackupFrequency } from '@/src/utils/cron_backup_frequency';

@Injectable()
export class BlogBackupService {
  constructor(
    @Inject('LOGGER_SERVICE') protected readonly loggerService: LoggerService,
    @Inject('BLOG_SERVICE') protected readonly blogService: BlogService,
  ) {}

  // @Cron('0 * * * * *')
  @Cron(getBackupFrequency())
  async handleCron() {
    console.log('Backing up blog Data');

    try {
      await this.blogService.backup();
    } catch (e) {
      this.loggerService.addErrorLog(`Error backing up blog data: ${e}`);
    }
  }
}
