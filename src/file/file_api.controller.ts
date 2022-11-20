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

import {
  DeleteResultJSON,
  FileDataService,
} from '@/src/file/file_data.service';
import { LoggerService } from '@/src/logger/logger.service';
import {
  FileDetailsJSON,
  ParsedFilesAndFields,
  ParsedImageFilesAndFields,
  UploadedFile,
} from '@/src/models/file_models';

import {
  isNullOrUndefined,
  isRecord,
  isString,
  isStringArray,
} from '@/src/utils/type_guards';
import { getIntFromString } from '@/src/utils/get_number_from_string';
import { FileSystemService } from '@/src/file/file_system_service';
import { FileOpsService } from './file_ops.service';

function isRejected(
  input: PromiseSettledResult<unknown>,
): input is PromiseRejectedResult {
  return input.status === 'rejected';
}

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
    this._uploadFilePath = this.configService.get('temp_file_path') ?? '';

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

    this._savedFilePath =
      this.configService.get('saved_file_path') ?? './files';

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
      this.loggerService.addErrorLog(`Error uploading files: ${e}`);
      throw new HttpException(
        'Error Uploading Files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('image_upload')
  @UseInterceptors(AuthRequiredIncerceptor)
  async uploadImages(@Req() request: Request, @UserId() userId: string) {
    let parsedData: ParsedImageFilesAndFields;

    // Step 1: Parse the image file and operations
    try {
      parsedData = await this.parseImageFilesAndFields(
        request,
        this._uploadFilePath,
      );
    } catch (e) {
      const msg = isString(e?.message) ? e.message : `${e}`;

      this.loggerService.addErrorLog(`${msg}: ${e}`);

      throw new HttpException('Error Uploading Files', HttpStatus.BAD_REQUEST);
    }

    const opsController = new FileOpsService(
      this.savedFilePath,
      this.uploadFilePath,
      this.fileService,
    );

    try {
      const savedFiles = await opsController.saveUploadedImages(
        parsedData,
        userId,
      );

      return savedFiles.map((f) => f.toJSON());
    } catch (e) {
      const msg = 'Error uploading image files';
      this.loggerService.addErrorLog(`${msg}: ${e}`);
      throw new HttpException(
        'Error Uploading Files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    if (isRejected(deleteFilesDBResult)) {
      this.loggerService.addErrorLog(
        `Error Deleting File: ${deleteFilesDBResult.reason}`,
      );

      throw new HttpException('', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // If there's an error from the file system
    if (isRejected(deleteFilesResult)) {
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
            const opsRaw = isString(fields?.ops) ? fields.ops : '{}';
            const parsedOps = JSON.parse(opsRaw);

            const ops: Record<string, unknown> = {};

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

            resolve({ files: uploadedFiles, ops });
          } catch (e) {
            reject(e);
          }
        },
      );
    });
  }

  /**
   * Parses a web form from the Express object and returns parsed data. The function
   * only parses some image types, specifically png, jpeg, gif, heic, bmp and tiff.
   */
  async parseImageFilesAndFields(
    req: Request,
    uploadPath: string,
  ): Promise<ParsedImageFilesAndFields> {
    const options: Partial<formidable.Options> = {
      multiples: true,
      filter: (opts) => {
        if (
          opts.mimetype == 'image/png' ||
          opts.mimetype == 'image/jpeg' ||
          opts.mimetype == 'image/gif' ||
          opts.mimetype == 'image/heic' ||
          opts.mimetype == 'image/bmp' ||
          opts.mimetype == 'image/tiff'
        ) {
          return true;
        }

        return false;
      },
    };

    if (uploadPath.length > 0) {
      options.uploadDir = uploadPath;
    }

    const form = new Formidable(options);

    return await new Promise<ParsedImageFilesAndFields>((resolve, reject) => {
      form.parse(
        req,
        (err, fields: formidable.Fields, files: formidable.Files) => {
          if (err) {
            console.error(err);
            reject(err);
          }
          try {
            // Parse the operations passed
            const opsRaw = isString(fields?.ops) ? fields.ops : '[]';
            const parsedOps = JSON.parse(opsRaw);

            if (!Array.isArray(parsedOps)) {
              reject(new Error('Invalid Ops Input'));
            }

            const ops: Record<string, Record<string, unknown>> = {};

            // Saves all ops to a Record. The key is the identifier.
            parsedOps.forEach((op) => {
              if (isRecord(op)) {
                const id = isString(op?.identifier) ? op.identifier : '';

                ops[id] = op;
              }
            });

            const uploadedFiles: UploadedFile[] = [];

            if (Array.isArray(files.image)) {
              for (const image of files.image) {
                uploadedFiles.push(UploadedFile.fromFormidable(image));
              }
            } else {
              uploadedFiles.push(UploadedFile.fromFormidable(files.image));
            }

            resolve({ imageFiles: uploadedFiles, ops });
          } catch (e) {
            reject(e);
          }
        },
      );
    });
  }
}
