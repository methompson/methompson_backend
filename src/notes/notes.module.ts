import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';
import { NotesController } from '@/src/notes/notes.controller';
import { InMemoryNotesService } from '@/src/notes/notes.service.memory';
import { isString } from '@/src/utils/type_guards';
import { FileNotesService } from '@/src/notes/notes.service.file';

const notesServiceFactory = {
  provide: 'NOTE_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('notesType');
    console.log('Notes Service Factory', type);

    if (type === 'file') {
      const path = configService.get('notesFilePath');
      if (isString(path)) {
        const service = await FileNotesService.init(path);
        return service;
      }
    }

    return new InMemoryNotesService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [NotesController],
  providers: [notesServiceFactory],
})
export class NotesModule {}
