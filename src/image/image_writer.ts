import { exec } from 'child_process';
import { rm } from 'fs/promises';

import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { ImageDimensions, ImageResizeOptions } from '@/src/models/image_models';
import {
  NewFileDetails,
  NewFileDetailsJSON,
  ParsedImageFilesAndFields,
  UploadedFile,
} from '@/src/models/file_models';
import { isBoolean } from '../utils/type_guards';

/**
 * The ImageWriter class represents an API to handle image files. It performs
 * actions such as converting image files, saving them to a file system,
 * retrieving image files from the file system and deleting them from the
 * file system.
 *
 * It also employs ImageMagick to perform conversions so that an image can
 * be compressed and resized into smaller versions.
 */
export class ImageWriter {
  constructor(private savedImagePath: string) {}

  async convertImages(
    parsedData: ParsedImageFilesAndFields,
    authorId: string,
  ): Promise<NewFileDetails[]> {
    if (parsedData.imageFiles.length == 0) {
      throw new HttpException('No Image File Provided', HttpStatus.BAD_REQUEST);
    }

    // We extract all of the details from the arguments
    const { ops, imageFiles } = parsedData;

    const finalOps =
      Object.keys(ops).length === 0 ? { '': { retainImage: true } } : ops;

    // the conversionPromises variable holds the end result for all of the conversions
    // that we're executing. We map the image files themselves, and perform all image
    // ops within the map function
    const conversionPromises: Promise<NewFileDetailsJSON[]>[] = imageFiles.map(
      async (imageFile) => {
        const promises = Object.keys(finalOps).map((key) => {
          const op = finalOps[key];
          const resizeOptions = ImageResizeOptions.fromWebFields(op);

          const isPrivate = isBoolean(op.isPrivate) ? op.isPrivate : true;

          return this.makeAndRunResizeScript(
            imageFile,
            resizeOptions,
            authorId,
            isPrivate,
          );
        });

        const imageDetails = await Promise.all(promises);

        await rm(imageFile.filepath);

        return imageDetails;
      },
    );

    const imageDetails = await Promise.all(conversionPromises);

    return imageDetails.flat().map((detail) => NewFileDetails.fromJSON(detail));
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
    authorId: string,
    isPrivate: boolean,
  ): Promise<NewFileDetailsJSON> {
    // We make the resize script and run it here.
    const newFilename = uuidv4();
    const result = this.buildResizeScript(
      imageFile,
      resizeOptions,
      newFilename,
    );

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

    const newMimetype = resizeOptions.newMimetype ?? imageFile.mimetype;

    const resolution = await this.getFileDimensions(result.newFilepath);
    return {
      filepath: imageFile.filepath,
      authorId,
      originalFilename: imageFile.originalFilename,
      dateAdded: new Date().toISOString(),
      mimetype: newMimetype,
      filename: newFilename,
      size: imageFile.size,
      isPrivate,
      metadata: {
        'resolution.x': resolution.x,
        'resolution.y': resolution.y,
        imageIdentifier: resizeOptions.identifier,
      },
    };
  }

  async getFileDimensions(filepath: string): Promise<ImageDimensions> {
    const script = `identify -format "%w,%h" ${filepath}`;

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
    newFilename: string,
  ) {
    const { filepath } = imageFile;
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

    let script = `convert ${filepath}`;
    script += ' -quality 90';

    if (options.resize !== false) {
      const maxSize = options.maxSize ?? 1280;
      script += ` -resize ${maxSize}x${maxSize}\\>`;
    }

    if (options.stripMeta) {
      script += ' -strip';
    }

    const outputType =
      options.imageFormatPrefix.length > 0
        ? `${options.imageFormatPrefix}:`
        : '';

    script += ` ${outputType}"${newFilepath}"`;

    return { newFilename, newFilepath, script };
  }

  // getNewFileName(imageFile: UploadedFile, options: ImageResizeOptions) {
  //   let ext = options.newFileNameInfo.ext;
  //   if (options.doNotConvert) {
  //     ext = imageFile.nameComponents.extension;
  //   }

  //   return `${options.newFileNameInfo.name}.${ext}`;
  // }

  // async deleteImages(imageDetails: FileDetails) {
  //   const paths = imageDetails.imageDetailsList.map((file) =>
  //     path.join(this.savedImagePath, file.filename),
  //   );

  //   const deletePromises = paths.map((path) => rm(path));

  //   const results = await Promise.allSettled(deletePromises);

  //   console.log('delete results', results);
  // }

  // /**
  //  * Attempts to roll back any writes that occurred in case of an error
  //  */
  // async rollBackWrites(details: FileDetails) {
  //   const promises = details.imageDetailsList.map((file) =>
  //     rm(`${this.savedImagePath}/${file.filename}`),
  //   );

  //   await Promise.all(promises);
  // }
}
