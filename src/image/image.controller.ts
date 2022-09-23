import { mkdir, stat } from 'fs/promises';
import path from 'path';

import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Res,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import formidable, { Formidable } from 'formidable';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { ImageWriter } from '@/src/image/image_writer';
import {
  ImageDetails,
  ParsedFilesAndFields,
  UploadedFile,
} from '@/src/models/image_models';
import { isString, isRecord } from '@/src/utils/type_guards';
import { AuthModel } from '@/src/models/auth_model';
import { ImageDataService } from '@/src/image/image_data.service';
import { NotFoundError, InvalidStateError } from '@/src/errors';
import { AuthRequiredIncerceptor } from '@/src/middleware/auth_interceptor';
import { UserId } from '@/src/middleware/auth_model_decorator';
import { getNumberFromString } from '../utils/get_number_from_string';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/image' })
export class ImageController {
  private uploadPath: string;
  private savedImagePath: string;

  constructor(
    private configService: ConfigService,
    @Inject('IMAGE_SERVICE') private readonly imageService: ImageDataService,
  ) {
    this.init();
  }

  /**
   * Configures the temp and saved image paths.
   */
  async init() {
    this.uploadPath = this.configService.get('temp_image_path') ?? '';

    if (this.uploadPath.length > 0) {
      await mkdir(this.uploadPath, {
        recursive: true,
      });
    }

    const savedImagePath = this.configService.get('saved_image_path');
    try {
      await mkdir(savedImagePath, { recursive: true });
    } catch (e) {
      console.error('Invalid Saved Image Path');
      process.exit();
    }

    this.savedImagePath = savedImagePath;
  }

  @Get('list')
  @UseInterceptors(AuthRequiredIncerceptor)
  async getImageList(@Req() request: Request): Promise<void> {
    const pageQP = request.query?.page;
    const paginationQP = request.query?.pagination;

    const page = isString(pageQP) ? getNumberFromString(pageQP, 1) : 1;
    const pagination = isString(paginationQP)
      ? getNumberFromString(paginationQP, 20)
      : 20;
  }

  /**
   * Retrieves an image by the new image file name that was generated from the
   * uploadImage function.
   */
  @Get(':imageName')
  async getImageByName(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const imageName = request.params?.imageName;
    const pathToImage = path.join(this.savedImagePath, imageName);

    try {
      await stat(pathToImage);
    } catch (e) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    let imageDetails: ImageDetails;
    try {
      imageDetails = await this.imageService.getImageByName(imageName);
    } catch (e) {
      if (e instanceof InvalidStateError) {
        throw new HttpException(
          'server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (e instanceof NotFoundError) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      throw new HttpException('server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (imageDetails.isPrivate) {
      const authModel = response.locals.auth;
      if (!AuthModel.isAuthModel(authModel)) {
        throw new HttpException(
          'Invalid Autorization Token',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!authModel.authorized) {
        throw new HttpException('Not Authorized', HttpStatus.UNAUTHORIZED);
      }
    }

    response.sendFile(pathToImage);
  }

  @Post('upload')
  @UseInterceptors(AuthRequiredIncerceptor)
  async uploadImages(
    @Req() request: Request,
    @UserId() userId: string,
  ): Promise<void> {
    let parsedData;

    try {
      parsedData = await this.parseImageFilesAndFields(
        request,
        this.uploadPath,
      );
    } catch (e) {
      const msg = isString(e?.message) ? e.message : `${e}`;
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }

    const iw = new ImageWriter(this.savedImagePath);
    const imageDetails = await iw.convertImages(parsedData, userId);

    // const promises: Promise<unknown>[] = imageDetails.map((img) =>
    //   this.imageService.addImage(img),
    // );

    try {
      await this.imageService.addImages(imageDetails);
    } catch (e) {
      // Roll back file writes
      const promises = imageDetails.map((details) =>
        iw.rollBackWrites(details),
      );

      await Promise.all(promises);

      throw new HttpException(
        'Error Writing Image to database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('delete/:imageName')
  @UseInterceptors(AuthRequiredIncerceptor)
  async deleteImage(@Req() request: Request): Promise<void> {
    const imageName = request.params?.imageName;

    try {
      const imageDetails = await this.imageService.deleteImage({
        filename: imageName,
      });

      const iw = new ImageWriter(this.savedImagePath);
      await iw.deleteImages(imageDetails);
    } catch (e) {
      console.error(e);
      throw new HttpException('server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Parses a web form from the Express object and returns parsed data. The function
   * only parses some image types, specifically png, jpeg, gif, heic, bmp and tiff.
   *
   * @param req {Request} The Express Request object
   * @param uploadPath {string} String representation of where files are uploaded
   * @returns {Promise<ParsedFilesAndFields>} Parsed data
   */
  async parseImageFilesAndFields(
    req: Request,
    uploadPath: string,
  ): Promise<ParsedFilesAndFields> {
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

    return await new Promise<ParsedFilesAndFields>((resolve, reject) => {
      form.parse(
        req,
        (err, fields: formidable.Fields, files: formidable.Files) => {
          if (err) {
            console.error(err);
            reject(err);
          }

          // Parse the operations passed
          const opsRaw = isString(fields?.ops) ? fields.ops : '[]';
          const parsedOps = JSON.parse(opsRaw);

          if (!Array.isArray(parsedOps)) {
            reject(new Error('Invalid Ops Input'));
          }

          const ops: Record<string, Record<string, unknown>> = {};

          parsedOps.forEach((op) => {
            if (isRecord(op)) {
              const id = isString(op?.identifier) ? op.identifier : '';

              ops[id] = op;
            }
          });

          if (Array.isArray(files.image)) {
            const uploadedFiles: UploadedFile[] = files.image.map((image) =>
              UploadedFile.fromFormidable(image),
            );

            resolve({ imageFiles: uploadedFiles, ops });
            return;
          }

          const uploadedFile = UploadedFile.fromFormidable(files.image);
          resolve({ imageFiles: [uploadedFile], ops });
        },
      );
    });
  }
}
