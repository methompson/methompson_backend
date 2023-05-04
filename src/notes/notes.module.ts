import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';
import { NotesController } from './notes.controller';
import { InMemoryNotesService } from './notes.service.memory';

const notesServiceFactory = {
  provide: 'NOTE_SERVICE',
  useFactory: async (configService: ConfigService) =>
    // const type = configService.get('blogType');

    // if (type === 'mongo_db') {
    //   try {
    //     const service = MongoBlogService.makeFromConfig(configService);
    //     service.initialize();
    //     return service;
    //   } catch (e) {
    //     console.error('blogServiceFactory Error:', e);
    //     throw e;
    //   }
    // }

    // return new InMemoryBlogService();

    new InMemoryNotesService(),
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [NotesController],
  providers: [notesServiceFactory],
})
export class NotesModule {}
