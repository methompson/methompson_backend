import { mkdir } from 'fs/promises';

import {
  Controller,
  Get,
  Post,
  Req,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import formidable, { Formidable } from 'formidable';

import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { ImageWriter } from '@/src/image/image_writer';
import {
  ParsedFilesAndFields,
  UploadedFile,
} from '@/src/image/image_data_types';
import { isString } from '@/src/utils/type_guards';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/image' })
export class ImageController {
  constructor(private configService: ConfigService) {}

  @Get(':imageId')
  async getImageById(): Promise<void> {
    console.log('Get');
  }

  @Post('upload')
  async uploadImage(@Req() req: Request): Promise<void> {
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

    const parsedData = await this.parseImageFilesAndFields(req, uploadPath);

    const iw = new ImageWriter(savedImagePath);
    iw.convertImages(parsedData);
  }

  @Post('delete/:imageId')
  async deleteImage(): Promise<void> {
    console.log('Delete');
  }

  async parseImageFilesAndFields(
    req: Request,
    uploadDir: string,
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

    if (uploadDir.length > 0) {
      options.uploadDir = uploadDir;
    }

    const form = new Formidable(options);

    return await new Promise<ParsedFilesAndFields>((resolve, reject) => {
      form.parse(req, (err, fields, files: formidable.Files) => {
        if (err) {
          console.error(err);
          reject(err);
        }

        if (Array.isArray(files.image)) {
          const uploadedFiles: UploadedFile[] = files.image.map((image) =>
            UploadedFile.fromFormidable(image),
          );

          resolve({ imageFiles: uploadedFiles, fields });
          return;
        }

        const uploadedFile = UploadedFile.fromFormidable(files.image);

        resolve({ imageFiles: [uploadedFile], fields });
      });
    });
  }
}
