import * as fsPromises from 'fs/promises';
import { FileHandle } from 'fs/promises';
import { Stats } from 'fs';

import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

import { LoggerController } from '@/src/logger/logger.controller';

const FILE_PATH = 'logs';
const FILE_NAME = 'blog.log';
const TOTAL_OLD_LOGS = 5;
const MAX_LOG_SIZE_IN_BYTES = 512 * 1024;

export class FileLoggerController implements LoggerController {
  constructor(protected fileHandle: FileHandle) {}

  get isoTime() {
    return new Date().toISOString();
  }

  async addRequestLog(req: Request, res: Response) {
    const requestType = req.method;
    const path = req.path;
    const remoteAddress =
      req.header['x-forwarded-for'] ?? req.socket.remoteAddress;

    const msg = `${this.isoTime} - ${remoteAddress} - ${requestType} - ${path}\n`;

    this.fileHandle.write(msg);
  }

  async addLog(msg: unknown) {
    console.log(`${this.isoTime} - addLog - ${msg}`);
  }

  async addErrorLog(msg: unknown) {
    console.error(`${this.isoTime} - addErrorLog - ${msg}`);
  }

  async addWarningLog(msg: unknown) {
    console.warn(`${this.isoTime} - addWarningLog - ${msg}`);
  }

  async cycleLogs() {
    const basePath = `${FILE_PATH}/${FILE_NAME}`;
    const fileStat = await FileLoggerController.getFileStat(basePath);

    if (fileStat !== null) {
      // Size in bytes
      const size = fileStat.size;
      if (size < MAX_LOG_SIZE_IN_BYTES) {
        return;
      }
    }

    // console.log(fileStat);

    this.fileHandle.close();

    for (let i = TOTAL_OLD_LOGS - 1; i > 0; i--) {
      const filePath = `${basePath}.${i}`;

      if (await FileLoggerController.fileExists(filePath)) {
        const newFilePath = `${basePath}.${i + 1}`;
        await fsPromises.rename(filePath, newFilePath);
      }
    }

    await fsPromises.rename(basePath, `${basePath}.1`);

    this.fileHandle = await FileLoggerController.makeFileHandle();
  }

  static async getFileStat(filePath: string): Promise<Stats | null> {
    try {
      return await fsPromises.stat(filePath);
    } catch (e) {
      return null;
    }
  }

  static async fileExists(filePath: string): Promise<boolean> {
    const stats = await FileLoggerController.getFileStat(filePath);

    return stats !== null;
  }

  static async makeFileHandle(): Promise<FileHandle> {
    try {
      await fsPromises.mkdir(FILE_PATH, {
        recursive: true,
      });
    } catch (e) {}

    const filePath = `${FILE_PATH}/${FILE_NAME}`;

    // await FileLoggerController.fileExists(filePath);

    const fileHandle = await fsPromises.open(filePath, 'a');

    return fileHandle;
  }

  static async init(): Promise<FileLoggerController> {
    const fileHandle = await FileLoggerController.makeFileHandle();

    return new FileLoggerController(fileHandle);
  }
}
