import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { NotesRequestOutput, NotesService } from '@/src/notes/notes.service';
import { LoggerService } from '@/src/logger/logger.service';
import { isString } from '@/src/utils/type_guards';
import { getIntFromString } from '@/src/utils/get_number_from_string';
import { DatabaseNotAvailableException } from '@/src/errors';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/notes' })
export class NotesController {
  constructor(
    @Inject('NOTE_SERVICE')
    private readonly notesService: NotesService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  async getNotes(@Req() request: Request): Promise<NotesRequestOutput> {
    console.log('getting notes controller');
    const pageQP = request.query?.page;
    const paginationQP = request.query?.pagination;

    const page = isString(pageQP) ? getIntFromString(pageQP, 1) : 1;
    const pagination = isString(paginationQP)
      ? getIntFromString(paginationQP, 10)
      : 10;

    try {
      return await this.notesService.getNotes(page, pagination);
    } catch (e) {
      if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      await this.loggerService.addErrorLog(e);
      throw e;
    }
  }

  @Get(':id')
  async getById() {
    throw new Error('Unimplemented');
  }
}
