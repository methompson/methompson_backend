import { mkdir } from 'fs/promises';

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
import { ImageDataService } from './image_data.service';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/image' })
export class ImageController {
  constructor(
    private configService: ConfigService,
    @Inject('IMAGE_SERVICE') private readonly imageService: ImageDataService,
  ) {}

  /**
   * Retrieves an image by the new image file name that was generated from the
   * uploadImage function.
   */
  @Get(':imageId')
  async getImageById(): Promise<void> {
    console.log('Get');
  }

  @Post('upload')
  async uploadImages(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
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

    const userId = authModel.userId;
    if (userId.length === 0) {
      throw new HttpException(
        'Invalid Autorization Token',
        HttpStatus.BAD_REQUEST,
      );
    }

    const uploadPath = this.configService.get('temp_image_path');

    if (!isString(uploadPath)) {
      throw new HttpException(
        'Invaid Upload Dir Config',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (uploadPath.length > 0) {
      await mkdir(uploadPath, {
        recursive: true,
      });
    }

    const savedImagePath = this.configService.get('saved_image_path');
    await mkdir(savedImagePath, { recursive: true });

    let parsedData;

    try {
      parsedData = await this.parseImageFilesAndFields(req, uploadPath);
    } catch (e) {
      const msg = isString(e?.message) ? e.message : `${e}`;
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }

    const iw = new ImageWriter(savedImagePath);
    const results = await iw.convertImages(parsedData);

    const imageDetails: ImageDetails[] = results.map((img) =>
      ImageDetails.fromNewImageDetails(userId, img),
    );

    console.log(results);

    const promises: Promise<unknown>[] = imageDetails.map((img) =>
      this.imageService.addImage(img),
    );

    await Promise.all(promises);
  }

  @Post('delete/:imageId')
  async deleteImage(): Promise<void> {
    console.log('Delete');
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
