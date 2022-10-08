import { exec } from 'child_process';
import path from 'path';
import { rm } from 'fs/promises';

import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import {
  FileDetailsInterface,
  ImageDetails,
  ImageDimensions,
  ImageResizeOptions,
  NewImageDetails,
  ParsedFilesAndFields,
  UploadedFile,
} from '@/src/models/image_models';

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
    parsedData: ParsedFilesAndFields,
    authorId: string,
    isPrivate = false,
  ): Promise<NewImageDetails[]> {
    if (parsedData.imageFiles.length == 0) {
      throw new HttpException('No Image File Provided', HttpStatus.BAD_REQUEST);
    }

    // We extract all of the details from the arguments
    const { ops, imageFiles } = parsedData;

    // otherOps are the default operations that we utilize to make sure that
    // things run as intend. If no operations are provided by the user, we
    // add a default, empty operation here.
    const otherOps = {};
    if (Object.keys(ops).length === 0) {
      otherOps[''] = {};
    }

    // We also add a default thumb operation here. If the user supersedes the
    // thumb operation, that's fine.
    otherOps['thumb'] = {
      identifier: 'thumb',
      resize: true,
      maxSize: 128,
      stripMeta: true,
    };

    // opsFinal represent the final list of operations that we will use to
    // convert images.
    const opsFinal = {
      ...otherOps,
      ...ops,
    };

    // This date is used for adding metadata to the eventual return data for this function
    const now = new Date();

    // the conversionPromises variable holds the end result for all of the conversions
    // that we're executing. We map the image files themselves, and perform all image
    // ops within the map function
    const conversionPromises: Promise<NewImageDetails>[] = imageFiles.map(
      async (imageFile) => {
        const newFilename = uuidv4();
        const promises: Promise<FileDetailsInterface>[] = [];

        Object.keys(opsFinal).forEach((key) => {
          const op = opsFinal[key];
          const resizeOptions = ImageResizeOptions.fromWebFields(
            newFilename,
            op,
          );

          promises.push(this.makeAndRunResizeScript(imageFile, resizeOptions));
        });

        const files: FileDetailsInterface[] = await Promise.all(promises);

        await rm(imageFile.filepath);

        return NewImageDetails.fromJSON({
          files,
          imageId: newFilename,
          originalFilename: imageFile.originalFilename,
          dateAdded: now.toISOString(),
          authorId,
          isPrivate,
        });
      },
    );

    const imageDetails = await Promise.all(conversionPromises);

    return imageDetails;
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
  ): Promise<FileDetailsInterface> {
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
    // console.log(result.newFilename, `${dimensions.x}x${dimensions.y}`);

    return {
      filename: this.getNewFileName(imageFile, resizeOptions),
      dimensions,
      identifier: resizeOptions.identifier,
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

    let script = `convert ${filepath}`;
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

  async deleteImages(imageDetails: ImageDetails) {
    const paths = imageDetails.files.map((file) =>
      path.join(this.savedImagePath, file.filename),
    );

    const deletePromises = paths.map((path) => rm(path));

    const results = await Promise.allSettled(deletePromises);

    console.log('delete results', results);
  }

  /**
   * Attempts to roll back any writes that occurred in case of an error
   */
  async rollBackWrites(details: NewImageDetails) {
    const promises = details.files.map((file) =>
      rm(`${this.savedImagePath}/${file.filename}`),
    );

    await Promise.all(promises);
  }
}
