import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryDepositConversionsService } from './deposit_conversions.service.memory';
import { DepositConversion } from '@/src/models/vice_bank/deposit_conversion';

const BASE_NAME = 'deposit_conversions_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileDepositConversionsService extends InMemoryDepositConversionsService {
  constructor(
    protected readonly fileHandle: FileHandle,
    protected readonly viceBankPath: string,
    depositConversions?: DepositConversion[],
  ) {
    super(depositConversions);
  }

  get depositConversionsString(): string {
    return JSON.stringify(Object.values(this.depositConversions));
  }

  async addDepositConversion(
    depositConversion: DepositConversion,
  ): Promise<DepositConversion> {
    const result = super.addDepositConversion(depositConversion);

    await this.writeToFile();

    return result;
  }

  async updateDepositConversion(
    depositConversion: DepositConversion,
  ): Promise<DepositConversion> {
    const result = await super.updateDepositConversion(depositConversion);

    await this.writeToFile();

    return result;
  }

  async deleteDepositConversion(
    depositConversionId: string,
  ): Promise<DepositConversion> {
    const result = await super.deleteDepositConversion(depositConversionId);

    await this.writeToFile();

    return result;
  }

  async writeToFile(): Promise<void> {
    const postsJson = this.depositConversionsString;

    await this.fileHandle.truncate(0);
    await this.fileHandle.write(postsJson, 0);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await FileDepositConversionsService.writeBackup(
      backupPath,
      this.depositConversionsString,
    );
  }

  static async makeFileHandle(
    viceBankPath: string,
    name?: string,
  ): Promise<FileHandle> {
    await mkdir(viceBankPath, { recursive: true });

    const filename = name ?? FILE_NAME;

    const filepath = join(viceBankPath, filename);

    const fileHandle = await open(filepath, 'a+');

    return fileHandle;
  }

  static async writeBackup(
    viceBankPath: string,
    rawData: string,
    name?: string,
  ) {
    const filename =
      name ??
      `${BASE_NAME}_backup_${new Date().toISOString()}.${FILE_EXTENSION}`;
    const fileHandle = await FileDepositConversionsService.makeFileHandle(
      viceBankPath,
      filename,
    );

    await fileHandle.truncate(0);
    await fileHandle.write(rawData, 0);
    await fileHandle.close();
  }

  static async init(
    viceBankPath: string,
  ): Promise<FileDepositConversionsService> {
    const fileHandle = await FileDepositConversionsService.makeFileHandle(
      viceBankPath,
    );
    const buffer = await fileHandle.readFile();

    const users: DepositConversion[] = [];
    let rawData = '';

    try {
      rawData = buffer.toString();

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            users.push(DepositConversion.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }
    } catch (e) {
      console.error('Invalid or no data when reading file data file', e);

      if (rawData.length > 0) {
        await FileDepositConversionsService.writeBackup(viceBankPath, rawData);
      }

      await fileHandle.truncate(0);
      await fileHandle.write('[]', 0);
    }

    return new FileDepositConversionsService(fileHandle, viceBankPath, users);
  }
}
