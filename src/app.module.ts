import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { mongodbConfiguration } from '@/src/config/mongodb_configuration';
import { blogConfiguration } from '@/src/config/blog_configuration';
import { logConfiguration } from '@/src/config/log_configuration';
import { authConfiguration } from '@/src/config/auth_configuration';
import { fileConfiguration } from '@/src/config/file_configuration';
import { actionBankConfiguration } from './config/action_bank_configuration';

import { BlogModule } from '@/src/blog/blog.module';
import { LoggerModule } from '@/src/logger/logger.module';

import { authCheckMiddlewareFactory } from '@/src/middleware/auth_check.middleware';
import { FileUploadModule } from '@/src/file/file.module';
import { NotesModule } from '@/src/notes/notes.module';
import { noteConfiguration } from '@/src/config/note_configuration';
import { ActionBankModule } from './action_bank/action_bank.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        fileConfiguration,
        mongodbConfiguration,
        blogConfiguration,
        actionBankConfiguration,
        logConfiguration,
        authConfiguration,
        noteConfiguration,
      ],
    }),
    LoggerModule,
    BlogModule,
    FileUploadModule,
    NotesModule,
    ActionBankModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authCheckMiddlewareFactory()).forRoutes('');
  }
}
