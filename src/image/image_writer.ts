import { exec } from 'child_process';
import * as path from 'path';

import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { ImageDimensions, ImageResizeOptions } from '@/src/models/image_models';
import {
  FileDetailsBase,
  NewFileDetailsJSON,
  ParsedImageFilesAndFields,
  UploadedFile,
} from '@/src/models/file_models';
import { isPromiseFulfilled, isPromiseRejected } from '@/src/utils/type_guards';
import { FileSystemService } from '@/src/file/file_system_service';

interface ResizeScriptOutput {
  newFilename: string;
  newFilepath: string;
  script: string;
}

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
  constructor(private _savedImagePath: string) {}

  get savedImagePath(): string {
    return this._savedImagePath;
  }

  async convertImages(
    parsedData: ParsedImageFilesAndFields,
    authorId: string,
  ): Promise<NewFileDetailsJSON[]> {
    if (parsedData.imageFiles.length == 0) {
      throw new HttpException('No Image File Provided', HttpStatus.BAD_REQUEST);
    }

    // We extract all of the details from the arguments
    const { ops, imageFiles } = parsedData;

    const finalOps =
      Object.keys(ops).length === 0 ? { '': { retainImage: true } } : ops;

    // We save all new files here so that if the process fails, we can roll all writes back
    const newFilenames: string[] = [];

    // the conversionPromises variable holds the end result for all of the
    // conversions that we're executing. We map the image files themselves,
    // and perform all image ops within the map function
    // TODO - this array of arrays is bad, we need to flatten this.
    // TODO - Each resize op should be self-contained and roll back its own problems
    // TODO - Once a resize op needs to roll back, we should roll back remaining ops
    const conversionPromises: Promise<NewFileDetailsJSON>[] = [];
    imageFiles.forEach(async (imageFile) => {
      const promises = Object.keys(finalOps).map(async (key) => {
        const op = finalOps[key];
        const resizeOptions = ImageResizeOptions.fromWebFields(op);

        const newFilename = uuidv4();
        newFilenames.push(newFilename);

        try {
          const result = await this.makeAndRunResizeScript(
            newFilename,
            imageFile,
            resizeOptions,
            authorId,
            resizeOptions.isPrivate,
          );

          return result;
        } catch (e) {
          await this.rollBackWrites([
            path.join(this.savedImagePath, newFilename),
          ]);
          throw new Error(`Error converting image - ${newFilename} - ${e}`);
        }
      });

      conversionPromises.push(...promises);
    });

    // We let all image operations finish. If there are any failures, we roll
    // back all failures, one-by-one. We maintain a list of all file names so
    // that if the image write was successful, but another op, like getting
    // resolution or file size fails, we can delete that file as well.
    const imageDetailResults = await Promise.allSettled(conversionPromises);

    const imageErrors = imageDetailResults
      .filter(isPromiseRejected)
      .map((el) => el.reason.toString());
    const imageSuccess = imageDetailResults
      .filter(isPromiseFulfilled)
      .map((el) => el.value)
      .flat();

    if (imageErrors.length > 0) {
      const filesToDelete = imageSuccess.map((el) =>
        path.join(this.savedImagePath, el.fileDetails.filename),
      );

      await this.rollBackWrites(filesToDelete);

      throw new Error(
        `Error converting images: ${JSON.stringify(imageErrors)}`,
      );
    }

    return imageSuccess;
  }

  /**
   * Takes a UploadedFile object and resize options and constructs a shell
   * script that runs ImageMagick with a variety of options.
   *
   * @param {UploadedFile} imageFile image file data that's used for path and name
   * @param {ImageResizeOptions} resizeOptions options used to construct a resize script
   */
  async makeAndRunResizeScript(
    newFilename: string,
    imageFile: UploadedFile,
    resizeOptions: ImageResizeOptions,
    authorId: string,
    isPrivate: boolean,
    fileSystemService?: FileSystemService,
  ): Promise<NewFileDetailsJSON> {
    // We make the resize script and run it here.
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

    const fss = fileSystemService ?? new FileSystemService();

    const newSize = (
      await fss.getFileInfo(path.join(this.savedImagePath, newFilename))
    ).size;

    const newMimetype = resizeOptions.newMimetype ?? imageFile.mimetype;
    const resolution = await this.getFileDimensions(result.newFilepath);

    const fileDetails = FileDetailsBase.fromJSON({
      authorId,
      originalFilename: imageFile.originalFilename,
      dateAdded: new Date().toISOString(),
      mimetype: newMimetype,
      filename: newFilename,
      size: newSize,
      isPrivate,
      metadata: {
        'resolution.x': resolution.x,
        'resolution.y': resolution.y,
        imageIdentifier: resizeOptions.identifier,
      },
    });

    return {
      filepath: imageFile.filepath,
      fileDetails,
    };
  }

  async getFileDimensions(filepath: string): Promise<ImageDimensions> {
    // const script = `identify -format "%w,%h ${filepath}`;
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
   */
  buildResizeScript(
    imageFile: UploadedFile,
    options: ImageResizeOptions,
    newFilename: string,
  ): ResizeScriptOutput {
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

  async rollBackWrites(
    filepaths: string[],
    fileSystemService?: FileSystemService,
  ) {
    const fss = fileSystemService ?? new FileSystemService();

    const promises = filepaths.map(async (path) => await fss.deleteFile(path));

    const result = await Promise.allSettled(promises);

    const errors = result.filter(isPromiseRejected).map((el) => `${el.reason}`);

    if (errors.length > 0) {
      throw new Error(`Unable to delete files: ${JSON.stringify(errors)}`);
    }
  }
}
