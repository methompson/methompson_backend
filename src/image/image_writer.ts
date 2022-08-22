import { exec } from 'child_process';

import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import {
  ParsedFilesAndFields,
  ImageResizeOptions,
  UploadedFile,
} from '@/src/image/image_data_types';

export class ImageWriter {
  constructor(private savedImagePath: string) {}

  async convertImages(parsedData: ParsedFilesAndFields) {
    if (parsedData.imageFiles.length == 0) {
      throw new HttpException('No Image File Provided', HttpStatus.BAD_REQUEST);
    }

    const { fields, imageFiles } = parsedData;

    const conversionPromises = imageFiles.map(async (imageFile) => {
      const newFilename = uuidv4();
      const resizeOptions = ImageResizeOptions.fromWebFields(
        newFilename,
        fields,
      );

      await this.makeAndRunResizeScript(imageFile, resizeOptions);
      await this.makeAndRunThumbnailScript(imageFile, newFilename);
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
    const script = this.buildResizeScript(imageFile, resizeOptions);

    await new Promise((resolve, reject) => {
      exec(script, (err, _stdout, stderr) => {
        if (err) {
          reject(err);
        }

        if (stderr) {
          reject(new Error(stderr));
        }

        resolve(null);
      });
    });
  }

  /**
   * Takes a UploadedFile object and file name and constructs an ImageResizeOptions
   * object to make a thumbnail image.
   *
   * @param {UploadedFile} imageFile image file data that's used for path and name
   * @param {string} newFilename the new file name that will be used for conversions
   * @returns {Promise} Resolves when the resize script is resolved
   */
  async makeAndRunThumbnailScript(
    imageFile: UploadedFile,
    newFilename: string,
  ) {
    const thumbResizeOptions = new ImageResizeOptions(newFilename + '_thumb', {
      resize: true,
      maxSize: 128,
      stripMeta: true,
    });

    return this.makeAndRunResizeScript(imageFile, thumbResizeOptions);
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
  buildResizeScript(
    imageFile: UploadedFile,
    options: ImageResizeOptions,
  ): string {
    // console.log('options', options);

    const filepath = imageFile.filepath;

    // If we get here, we should just move the file from the original location
    // to the new location.
    if (options.doNotConvert) {
      return `mv ${filepath} ${this.savedImagePath}/${options.newFilename}.${imageFile.nameComponents}`;
    }

    const newFileExtension = options.newFormat ?? 'jpg';
    const newFilename = options.newFilename;

    let script = `magick ${filepath}`;
    script += ' -quality 90';

    if (options.resize !== false) {
      const maxSize = options.maxSize ?? 1280;
      script += ` -resize ${maxSize}x${maxSize}\\>`;
    }

    if (options.stripMeta) {
      script += ' -strip';
    }

    script += ` "${this.savedImagePath}/${newFilename}.${newFileExtension}"`;

    return script;
  }

  /**
   * Attempts to roll back any writes that occurred in case of an error
   */
  async rollBackWrites() {}
}
