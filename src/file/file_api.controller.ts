import {
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseInterceptors,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import formidable, { Formidable } from 'formidable';

import { AuthRequiredIncerceptor } from '@/src/middleware/auth_interceptor';
import { UserId } from '@/src/middleware/auth_model_decorator';
import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';

import { LoggerService } from '@/src/logger/logger.service';
import {
  DeleteResultJSON,
  FileDataService,
} from '@/src/file/file_data.service';
import {
  FileDetailsJSON,
  FileOps,
  ParsedFilesAndFields,
  UploadedFile,
} from '@/src/models/file_models';
import { FileSystemService } from '@/src/file/file_system_service';
import { FileOpsService } from '@/src/file/file_ops.service';

import {
  isNullOrUndefined,
  isPromiseRejected,
  isRecord,
  isString,
  isStringArray,
} from '@/src/utils/type_guards';
import { getIntFromString } from '@/src/utils/get_number_from_string';
import {
  DatabaseNotAvailableException,
  UnimplementedError,
} from '@/src/errors';

interface FileListResponse {
  files: FileDetailsJSON[];
  totalFiles: number;
  page: number;
  pagination: number;
}

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/file' })
export class FileAPIController {
  private _uploadFilePath = '';
  private _savedFilePath = './files';

  constructor(
    private configService: ConfigService,
    @Inject('FILE_SERVICE') private readonly fileService: FileDataService,
    @Inject('LOGGER_SERVICE') private readonly loggerService: LoggerService,
  ) {
    this.init();
  }

  get uploadFilePath(): string {
    return this._uploadFilePath;
  }

  get savedFilePath(): string {
    return this._savedFilePath;
  }

  /**
   * Configures the temp and saved file paths.
   */
  async init() {
    this._uploadFilePath = this.configService.get('tempFilePath') ?? '';

    if (this._uploadFilePath.length > 0) {
      try {
        new FileSystemService().makeDirectory(this._uploadFilePath);
      } catch (e) {
        const msg = `Invalid Upload File Path: ${e}`;
        // console.error(msg);
        this.loggerService.addErrorLog(msg);
        process.exit();
      }
    }

    this._savedFilePath = this.configService.get('savedFilePath') ?? './files';

    try {
      new FileSystemService().makeDirectory(this._savedFilePath);
    } catch (e) {
      const msg = `Invalid Saved File Path: ${e}`;
      // console.error(msg);
      this.loggerService.addErrorLog(msg);
      process.exit();
    }
  }

  @Get('list')
  @UseInterceptors(AuthRequiredIncerceptor)
  async getFileList(@Req() request: Request): Promise<FileListResponse> {
    const pageQP = request.query?.page;
    const paginationQP = request.query?.pagination;

    const page = isString(pageQP) ? getIntFromString(pageQP, 1) : 1;
    const pagination = isString(paginationQP)
      ? getIntFromString(paginationQP, 20)
      : 20;

    try {
      const [fileList, totalFiles] = await Promise.all([
        this.fileService.getFileList({ page, pagination }),
        this.fileService.getTotalFiles(),
      ]);

      const files = fileList.map((el) => el.toJSON());

      return {
        files,
        totalFiles,
        page,
        pagination,
      };
    } catch (e) {
      if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.loggerService.addErrorLog(`Error Getting File List: ${e}`);

      throw new HttpException(
        'Error Getting File List',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('total')
  @UseInterceptors(AuthRequiredIncerceptor)
  async getTotal(): Promise<{ totalFiles: number }> {
    try {
      const totalFiles = await this.fileService.getTotalFiles();

      return {
        totalFiles,
      };
    } catch (e) {
      if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        'Error getting total files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload')
  @UseInterceptors(AuthRequiredIncerceptor)
  async uploadFiles(
    @Req() request: Request,
    @UserId() userId: string,
  ): Promise<FileDetailsJSON[]> {
    let parsedData: ParsedFilesAndFields;

    // Parse uploaded data
    try {
      parsedData = await this.parseFilesAndFields(
        request,
        this._uploadFilePath,
      );
    } catch (e) {
      if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const msg = isString(e?.message) ? e.message : `${e}`;
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }

    const opsController = new FileOpsService(
      this.savedFilePath,
      this.uploadFilePath,
      this.fileService,
    );

    try {
      const savedFiles = await opsController.saveUploadedFiles(
        parsedData,
        userId,
      );
      return savedFiles.map((f) => f.toJSON());
    } catch (e) {
      if (e instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.loggerService.addErrorLog(`Error uploading files: ${e}`);
      throw new HttpException(
        'Error Uploading Files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Expects a request with a body that is an object. Each key is a file id and
   * the value is the respective new metadata for the file including. Currently
   * we will expect the filename and isPrivate values to be editable.
   */
  @Post('update')
  @UseInterceptors(AuthRequiredIncerceptor)
  async updateFile(@Req() request: Request): Promise<FileDetailsJSON> {
    const body = request.body;

    if (!isRecord(body)) {
      throw new HttpException('Invalid Input', HttpStatus.BAD_REQUEST);
    }

    throw new UnimplementedError();
  }

  @Post('delete')
  @HttpCode(200)
  @UseInterceptors(AuthRequiredIncerceptor)
  async deleteFiles(@Req() request: Request): Promise<DeleteResultJSON[]> {
    // get file name
    const body = request.body;

    if (!isStringArray(body)) {
      throw new HttpException('Invalid Input', HttpStatus.BAD_REQUEST);
    }

    // Delete the file(s)
    const [deleteFilesDBResult, deleteFilesResult] = await Promise.allSettled([
      this.fileService.deleteFiles(body),
      new FileSystemService().deleteFiles(this._savedFilePath, body),
    ]);

    // If there's an error from the DB
    if (isPromiseRejected(deleteFilesDBResult)) {
      if (deleteFilesDBResult.reason instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      this.loggerService.addErrorLog(
        `Error Deleting File: ${deleteFilesDBResult.reason}`,
      );

      throw new HttpException('', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // If there's an error from the file system
    if (isPromiseRejected(deleteFilesResult)) {
      if (deleteFilesResult.reason instanceof DatabaseNotAvailableException) {
        throw new HttpException(
          'Database Not Available',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.loggerService.addErrorLog(
        `Error Deleting File: ${deleteFilesResult.reason}`,
      );

      throw new HttpException('', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return body.map((filename): DeleteResultJSON => {
      const output: DeleteResultJSON = { filename, errors: [] };

      const dbResult = deleteFilesDBResult.value[filename];
      if (isNullOrUndefined(dbResult)) {
        const msg = 'Invalid results from db operation';
        this.loggerService.addErrorLog(msg);
        throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (!isNullOrUndefined(dbResult.error)) {
        output.errors.push(dbResult.error);
      }

      if (!isNullOrUndefined(dbResult.fileDetails)) {
        output.fileDetails = dbResult.fileDetails.toJSON();
      }

      const fileSystemResult = deleteFilesResult.value?.[filename];
      if (isNullOrUndefined(fileSystemResult)) {
        const msg = 'Invalid results from file system operation';
        this.loggerService.addErrorLog(msg);
        throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (!isNullOrUndefined(fileSystemResult.error)) {
        output.errors.push(fileSystemResult.error);
      }

      return output;
    });
  }

  async parseFilesAndFields(
    req: Request,
    uploadPath: string,
  ): Promise<ParsedFilesAndFields> {
    const options: Partial<formidable.Options> = {
      multiples: true,
    };

    if (uploadPath.length > 0) {
      options.uploadDir = uploadPath;
    }

    const form = new Formidable(options);

    return await new Promise<ParsedFilesAndFields>((resolve, reject) => {
      form.parse(
        req,
        (err, fields: formidable.Fields, files: formidable.Files) => {
          if (err) {
            console.error(err);
            reject(err);
          }

          try {
            let opsRaw = '{}';

            if (Array.isArray(fields.ops) && isString(fields.ops[0])) {
              opsRaw = fields.ops[0];
            }

            const parsedOps = JSON.parse(opsRaw);

            const ops: Record<string, unknown> = {};
            const fileOps: Record<string, FileOps> = {};

            for (const [key, values] of Object.entries(
              parsedOps.fileOps ?? {},
            )) {
              if (isRecord(values)) {
                const isPrivate = !(values.isPrivate === false);
                fileOps[key] = {
                  isPrivate,
                  filename: key,
                };
              }
            }

            // isPrivate will always be true unless isPrivate is explicitly set to false
            ops.isPrivate = !(parsedOps.isPrivate === false);

            const uploadedFiles: UploadedFile[] = [];

            if (Array.isArray(files.file)) {
              for (const file of files.file) {
                uploadedFiles.push(UploadedFile.fromFormidable(file));
              }
            } else {
              uploadedFiles.push(UploadedFile.fromFormidable(files.file));
            }

            resolve({ files: uploadedFiles, ops, fileOps });
          } catch (e) {
            reject(e);
          }
        },
      );
    });
  }
}
