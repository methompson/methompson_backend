import { FileHandle, rename, stat, mkdir, open } from 'fs/promises';
import { Stats } from 'fs';

import { Request, Response } from 'express';

import { LoggerInstanceService } from '@/src/logger/loggerInstance.service';

const FILE_PATH = 'logs';
const FILE_NAME = 'blog.log';
const TOTAL_OLD_LOGS = 5;
const MAX_LOG_SIZE_IN_BYTES = 512 * 1024;

// TODO look into a writestream and queue for writing logs

export class FileLoggerInstanceService implements LoggerInstanceService {
  constructor(protected fileHandle: FileHandle) {}

  get isoTime() {
    return new Date().toISOString();
  }

  async addRequestLog(req: Request, _res: Response) {
    const requestType = req.method;
    const path = req.path;
    const remoteAddress =
      req.header('x-forwarded-for') ?? req.socket.remoteAddress;

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
    const fileStat = await FileLoggerInstanceService.getFileStat(basePath);

    // If fileStat is undefined, we close the old fileHandle (what's it pointing to?)
    // then we create a new one and go from there.
    if (fileStat === undefined) {
      this.fileHandle.close();
      this.fileHandle = await FileLoggerInstanceService.makeFileHandle();
      return;
    }

    // Size in bytes
    const size = fileStat.size;
    if (size < MAX_LOG_SIZE_IN_BYTES) {
      return;
    }
    // console.log(fileStat);

    // Close the current file handle
    this.fileHandle.close();

    // We cycle through all the old logs and
    for (let i = TOTAL_OLD_LOGS - 1; i > 0; i--) {
      const filepath = `${basePath}.${i}`;

      if (await FileLoggerInstanceService.fileExists(filepath)) {
        const newFilePath = `${basePath}.${i + 1}`;
        await rename(filepath, newFilePath);
      }
    }

    await rename(basePath, `${basePath}.1`);

    this.fileHandle = await FileLoggerInstanceService.makeFileHandle();
  }

  static async getFileStat(filepath: string): Promise<Stats | undefined> {
    try {
      return await stat(filepath);
    } catch (e) {
      return undefined;
    }
  }

  static async fileExists(filepath: string): Promise<boolean> {
    const stats = await FileLoggerInstanceService.getFileStat(filepath);

    return stats !== null;
  }

  static async makeFileHandle(): Promise<FileHandle> {
    await mkdir(FILE_PATH, {
      recursive: true,
    });

    const filepath = `${FILE_PATH}/${FILE_NAME}`;

    // await FileLoggerController.fileExists(filepath);

    const fileHandle = await open(filepath, 'a');

    return fileHandle;
  }

  static async init(): Promise<FileLoggerInstanceService> {
    const fileHandle = await FileLoggerInstanceService.makeFileHandle();

    return new FileLoggerInstanceService(fileHandle);
  }
}
