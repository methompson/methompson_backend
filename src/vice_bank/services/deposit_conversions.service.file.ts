import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryDepositConversionsService } from '@/src/vice_bank/services/deposit_conversions.service.memory';
import { DepositConversion } from '@/src/models/vice_bank/deposit_conversion';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

const BASE_NAME = 'deposit_conversions_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileDepositConversionsService extends InMemoryDepositConversionsService {
  constructor(
    protected readonly fileServiceWriter: FileServiceWriter,
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
    const json = this.depositConversionsString;

    await this.fileServiceWriter.writeToFile(this.viceBankPath, json);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await this.fileServiceWriter.writeBackup(
      backupPath,
      this.depositConversionsString,
    );
  }

  static async init(
    viceBankPath: string,
    options?: { fileServiceWriter?: FileServiceWriter },
  ): Promise<FileDepositConversionsService> {
    const fileServiceWriter =
      options?.fileServiceWriter ??
      new FileServiceWriter(BASE_NAME, FILE_EXTENSION);

    let rawData = '';

    const users: DepositConversion[] = [];
    try {
      rawData = await fileServiceWriter.readFile(viceBankPath);

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
      try {
        if (rawData.length > 0) {
          console.error('Invalid or no data when reading file data file', e);
          await fileServiceWriter.writeBackup(viceBankPath, rawData);
        } else {
          console.error('Init: No file data found. Creating new file.');
        }

        await fileServiceWriter.clearFile(viceBankPath);
      } catch (e) {
        console.error('unable to write to disk', e);
      }
    }

    return new FileDepositConversionsService(
      fileServiceWriter,
      viceBankPath,
      users,
    );
  }
}
