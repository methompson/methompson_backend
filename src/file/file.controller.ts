import * as path from 'path';

import {
  Controller,
  Get,
  Inject,
  Res,
  Req,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

import { NotFoundError } from '@/src/errors';
import { LoggerService } from '@/src/logger/logger.service';
import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { AuthModel } from '@/src/models/auth_model';
import { FileDataService } from '@/src/file/file_data.service';
import { FileSystemService } from '@/src/file/file_system_service';
import { isPromiseRejected } from '@/src/utils/type_guards';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'files' })
export class FileController {
  private _savedFilePath = './files/files';

  constructor(
    private configService: ConfigService,
    @Inject('FILE_SERVICE') private readonly fileService: FileDataService,
    @Inject('LOGGER_SERVICE') private readonly loggerService: LoggerService,
  ) {
    this.init();
  }

  get savedFilePath(): string {
    return this._savedFilePath;
  }

  /**
   * Configures the temp and saved file paths.
   */
  async init() {
    this._savedFilePath = this.configService.get('savedFilePath') ?? './files';
  }

  /**
   * Retrieves a file by the new filename that was generated from the
   * uploadFile function.
   */
  @Get(':filename')
  async getFileByName(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const auth = (request as unknown as Record<string, unknown>).authModel;
    if (!AuthModel.isAuthModel(auth)) {
      throw new HttpException('', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const filename = request.params?.filename;
    const pathToFile = path.join(this._savedFilePath, filename);

    const [statResult, fileDetailsResult] = await Promise.allSettled([
      new FileSystemService().pathExists(pathToFile),
      this.fileService.getFileByName(filename),
    ]);

    if (isPromiseRejected(fileDetailsResult)) {
      this.loggerService.addErrorLog(
        `Error Getting File: ${fileDetailsResult.reason}`,
      );

      if (auth.authorized) {
        if (fileDetailsResult.reason instanceof NotFoundError) {
          throw new HttpException('File not found', HttpStatus.NOT_FOUND);
        }

        throw new HttpException('', HttpStatus.INTERNAL_SERVER_ERROR);
      } else {
        throw new HttpException('', HttpStatus.BAD_REQUEST);
      }
    }

    if (isPromiseRejected(statResult)) {
      this.loggerService.addErrorLog(
        `Error Getting File: ${statResult.reason}`,
      );

      if (auth.authorized) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException('', HttpStatus.BAD_REQUEST);
      }
    }

    // parse the file details to determine if the file is private
    if (fileDetailsResult.value.isPrivate && !auth.authorized) {
      // we throw a 400 instead of a 401 just to keep the codes consistent.
      // We don't want to let the user know anything about the files from
      // the error codes.
      throw new HttpException('', HttpStatus.BAD_REQUEST);
    }

    // If we've made it this far, the file exists and the user has rights
    // to it, we will serve it up.

    response.type(fileDetailsResult.value.mimetype);
    response.sendFile(pathToFile);
  }
}
