import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { NewNote, Note } from '@/src/models/notes_model';

import { AuthRequiredIncerceptor } from '@/src/middleware/auth_interceptor';
import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';

import { LoggerService } from '@/src/logger/logger.service';
import { NotesRequestOutput, NotesService } from '@/src/notes/notes.service';

import { isString } from '@/src/utils/type_guards';
import { getIntFromString } from '@/src/utils/get_number_from_string';

import { DatabaseNotAvailableException, InvalidInputError } from '@/src/errors';

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
  @UseInterceptors(AuthRequiredIncerceptor)
  async getNotes(@Req() request: Request): Promise<NotesRequestOutput> {
    console.log('getting notes controller');
    const pageQP = request.query?.page;
    const paginationQP = request.query?.pagination;

    const page = isString(pageQP) ? getIntFromString(pageQP, 1) : 1;
    const pagination = isString(paginationQP)
      ? getIntFromString(paginationQP, 10)
      : 10;

    try {
      return await this.notesService.getNotes({ page, pagination });
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
  @UseInterceptors(AuthRequiredIncerceptor)
  async getById(@Req() request: Request) {
    const id = request.params?.id;

    if (!isString(id) || id.length === 0) {
      throw new HttpException('Invalid Slug', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.notesService.getById(id);
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw new HttpException('No notes', HttpStatus.NOT_FOUND);
      } else if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      console.error(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @UseInterceptors(AuthRequiredIncerceptor)
  async addNewNote(@Req() request: Request): Promise<Note> {
    try {
      const newNote = NewNote.fromJSON(request.body);
      console.log(newNote.toJSON());
      const note = await this.notesService.addNote(newNote);

      return note;
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw new HttpException(
          'Invalid New Note Input',
          HttpStatus.BAD_REQUEST,
        );
      } else if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('update')
  @UseInterceptors(AuthRequiredIncerceptor)
  async updateNote(@Req() request: Request): Promise<Note> {
    try {
      const note = Note.fromJSON(request);
      const result = await this.notesService.updateNote(note);

      return result;
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw new HttpException('Invalid Note Input', HttpStatus.BAD_REQUEST);
      } else if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('delete/:id')
  @UseInterceptors(AuthRequiredIncerceptor)
  async deleteNote(@Req() request: Request): Promise<Note> {
    const id = request.params?.id;

    if (!isString(id) || id.length === 0) {
      throw new HttpException('Invalid Slug', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.notesService.deleteNote(id);
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw new HttpException('No notes', HttpStatus.NOT_FOUND);
      } else if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      console.error(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
