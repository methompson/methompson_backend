import { exec } from 'child_process';

import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import {
  ParsedFilesAndFields,
  ImageResizeOptions,
  UploadedFile,
} from '@/src/image/image_data_types';
import { isNumber } from '../utils/type_guards';

interface ImageDimensions {
  x: number;
  y: number;
}

export class ImageWriter {
  constructor(private savedImagePath: string) {}

  async convertImages(parsedData: ParsedFilesAndFields) {
    if (parsedData.imageFiles.length == 0) {
      throw new HttpException('No Image File Provided', HttpStatus.BAD_REQUEST);
    }

    const { ops, imageFiles } = parsedData;

    const opsFinal = {
      thumb: {
        identifier: 'thumb',
        resize: true,
        maxSize: 128,
        stripMeta: true,
      },
      ...ops,
    };

    const conversionPromises = imageFiles.map(async (imageFile) => {
      const newFilename = uuidv4();
      const promises: Promise<unknown>[] = [];

      Object.keys(opsFinal).forEach((key) => {
        const op = opsFinal[key];
        const resizeOptions = ImageResizeOptions.fromWebFields(newFilename, op);

        promises.push(this.makeAndRunResizeScript(imageFile, resizeOptions));
      });

      await Promise.all(promises);

      await this.makeAndRunDeleteScript(imageFile);
    });

    await Promise.all(conversionPromises);
  }

  /**
   * Takes a UploadedFile object and resize options and constructs a shell
   * script that runs ImageMagick with a variety of options.
   *
   * @param {UploadedFile} imageFile image file data that's used for path and name
   * @param {ImageResizeOptions} resizeOptions options used to construct a resize script
   */
  async makeAndRunResizeScript(
    imageFile: UploadedFile,
    resizeOptions: ImageResizeOptions,
  ) {
    const result = this.buildResizeScript(imageFile, resizeOptions);

    await new Promise((resolve, reject) => {
      exec(result.script, (err, _stdout, stderr) => {
        if (err) {
          reject(err);
        }

        if (stderr) {
          reject(new Error(stderr));
        }

        resolve(null);
      });
    });

    const dimensions = await this.getFileDimensions(result.newFilepath);
    console.log(result.newFilename, `${dimensions.x}x${dimensions.y}`);
  }

  async getFileDimensions(filepath: string): Promise<ImageDimensions> {
    const script = `magick identify -format "%w,%h" ${filepath}`;

    return await new Promise((resolve, reject) => {
      exec(script, (err, stdout, stderr) => {
        if (err || stderr) {
          reject(new Error('image size script failed'));
        }

        const split = stdout.split(',');

        if (split.length !== 2) {
          reject(new Error('Image Size returned invalid value'));
        }

        const x = parseInt(split[0], 10);
        const y = parseInt(split[1], 10);

        if (Number.isNaN(x) || Number.isNaN(y)) {
          reject(new Error('Image Size returned invalid value'));
        }

        resolve({
          x,
          y,
        });
      });
    });
  }

  /**
   * Takes a UploadedFile object and deletes the original file.
   *
   * @param {UploadedFile} imageFile image file data that's used for path and name
   * @returns {Promise} returns a promise that resolves when the script has finished executing or throws an error
   */
  async makeAndRunDeleteScript(imageFile: UploadedFile) {
    const script = `rm ${imageFile.filepath}`;

    return new Promise((resolve, reject) => {
      exec(script, (_err, _stdout, _stderr) => {
        if (_err || _stderr) {
          reject(new Error('rm script failed'));
        }
        resolve(null);
      });
    });
  }

  /**
   * Builds an imageMagick resize script based upon the ImageResizeOptions
   * object passed in.
   *
   * @param {UploadedFile} imageFile image file data that's used for path and name
   * @param {ImageResizeOptions} options the options used to construct an ImageMagick shell script
   * @returns {string} the ImageMagick shell script meant to run in a POSIX shell
   */
  buildResizeScript(imageFile: UploadedFile, options: ImageResizeOptions) {
    const { filepath } = imageFile;
    const newFilename = this.getNewFileName(imageFile, options);
    const newFilepath = `${this.savedImagePath}/${newFilename}`;

    // If we get here, we should just copy the file from the original location
    // to the new location.
    if (options.doNotConvert) {
      return {
        newFilename,
        newFilepath,
        script: `cp ${filepath} ${newFilepath}`,
      };
    }

    let script = `magick ${filepath}`;
    script += ' -quality 90';

    if (options.resize !== false) {
      const maxSize = options.maxSize ?? 1280;
      script += ` -resize ${maxSize}x${maxSize}\\>`;
    }

    if (options.stripMeta) {
      script += ' -strip';
    }

    script += ` "${newFilepath}"`;

    return { newFilename, newFilepath, script };
  }

  getNewFileName(imageFile: UploadedFile, options: ImageResizeOptions) {
    let ext = options.newFileNameInfo.ext;
    if (options.doNotConvert) {
      ext = imageFile.nameComponents.extension;
    }

    return `${options.newFileNameInfo.name}.${ext}`;
  }

  /**
   * Attempts to roll back any writes that occurred in case of an error
   */
  async rollBackWrites() {}
}
