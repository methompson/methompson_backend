import { FileHandle, mkdir, open } from 'fs/promises';
import path from 'path';
import { Injectable } from '@nestjs/common';

import { DeleteDetails } from '@/src/file/file_data.service';
import { FileDetails, NewFileDetails } from '@/src/models/file_models';
import { InMemoryFileDataService } from './file_data.service.memory';

const BASE_NAME = 'files_data';
const FILE_NAME = `${BASE_NAME}.json`;

@Injectable()
export class FileFileDataService extends InMemoryFileDataService {
  constructor(protected fileHandle: FileHandle, files?: FileDetails[]) {
    super(files);
  }

  async addFiles(newFileDetails: NewFileDetails[]): Promise<FileDetails[]> {
    const details = await super.addFiles(newFileDetails);

    await this.writeToFile();

    return details;
  }

  async deleteFiles(names: string[]): Promise<Record<string, DeleteDetails>> {
    const details = await super.deleteFiles(names);

    await this.writeToFile();

    return details;
  }

  async writeToFile(): Promise<void> {
    const filesJson = JSON.stringify(Object.values(this._files));

    await this.fileHandle.truncate(0);
    await this.fileHandle.write(filesJson, 0);
  }

  static async makeFileHandle(
    filesPath: string,
    name?: string,
  ): Promise<FileHandle> {
    await mkdir(filesPath, {
      recursive: true,
    });

    const filename = name ?? FILE_NAME;

    const filepath = path.join(filesPath, filename);

    const fileHandle = await open(filepath, 'a+');

    return fileHandle;
  }

  static async moveOldDataToNewFile(filesPath: string, rawData: string) {
    const fileHandle = await FileFileDataService.makeFileHandle(
      filesPath,
      `${BASE_NAME}_${new Date().toISOString()}.json`,
    );

    await fileHandle.write(rawData, 0);
  }

  static async init(filesPath: string): Promise<FileFileDataService> {
    const fileHandle = await FileFileDataService.makeFileHandle(filesPath);
    const buffer = await fileHandle.readFile();

    const files: FileDetails[] = [];
    let rawData = '';

    try {
      rawData = buffer.toString();

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            files.push(FileDetails.fromJSON(val));
          } catch (e) {
            console.error('Invalid FileDetails: ', val, e);
          }
        }
      }
    } catch (e) {
      console.error('Invalid or no data when reading file data file', e);

      if (rawData.length > 0) {
        await FileFileDataService.moveOldDataToNewFile(filesPath, rawData);
      }

      await fileHandle.truncate(0);
      await fileHandle.write('[]', 0);
    }

    return new FileFileDataService(fileHandle, files);
  }
}
