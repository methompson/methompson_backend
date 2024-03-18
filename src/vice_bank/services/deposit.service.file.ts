import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryDepositService } from './deposit.service.memory';
import { Deposit } from '@/src/models/vice_bank/deposit';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

const BASE_NAME = 'deposit_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileDepositService extends InMemoryDepositService {
  constructor(
    protected readonly fileServiceWriter: FileServiceWriter,
    protected readonly viceBankPath: string,
    deposits?: Deposit[],
  ) {
    super(deposits);
  }

  get depositsString(): string {
    return JSON.stringify(Object.values(this.deposits));
  }

  async addDeposit(deposit: Deposit): Promise<Deposit> {
    const result = await super.addDeposit(deposit);

    await this.writeToFile();

    return result;
  }

  async updateDeposit(deposit: Deposit): Promise<Deposit> {
    const result = await super.updateDeposit(deposit);

    await this.writeToFile();

    return result;
  }

  async deleteDeposit(depositId: string): Promise<Deposit> {
    const result = await super.deleteDeposit(depositId);

    await this.writeToFile();

    return result;
  }

  async writeToFile(): Promise<void> {
    const json = this.depositsString;

    await this.fileServiceWriter.writeToFile(json);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await this.fileServiceWriter.writeBackup(backupPath, this.depositsString);
  }

  static async init(
    viceBankPath: string,
    options?: { fileServiceWriter?: FileServiceWriter },
  ): Promise<FileDepositService> {
    const fileServiceWriter =
      options?.fileServiceWriter ??
      new FileServiceWriter(BASE_NAME, FILE_EXTENSION);

    let rawData = '';

    const users: Deposit[] = [];
    try {
      rawData = await fileServiceWriter.readFile(viceBankPath);

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            users.push(Deposit.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }
    } catch (e) {
      console.error('Invalid or no data when reading file data file', e);

      try {
        if (rawData.length > 0) {
          await fileServiceWriter.writeBackup(viceBankPath, rawData);
        }

        await fileServiceWriter.clearFile();
      } catch (e) {
        console.error('unable to write to disk', e);
      }
    }

    return new FileDepositService(fileServiceWriter, viceBankPath, users);
  }
}
