import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryDepositService } from './deposit.service.memory';
import { Deposit } from '@/src/models/vice_bank/deposit';

const BASE_NAME = 'deposit_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileDepositService extends InMemoryDepositService {
  constructor(
    protected readonly fileHandle: FileHandle,
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
    const postsJson = this.depositsString;

    await this.fileHandle.truncate(0);
    await this.fileHandle.write(postsJson, 0);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await FileDepositService.writeBackup(backupPath, this.depositsString);
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
    const fileHandle = await FileDepositService.makeFileHandle(
      viceBankPath,
      filename,
    );

    await fileHandle.truncate(0);
    await fileHandle.write(rawData, 0);
    await fileHandle.close();
  }

  static async init(viceBankPath: string): Promise<FileDepositService> {
    const fileHandle = await FileDepositService.makeFileHandle(viceBankPath);
    const buffer = await fileHandle.readFile();

    const users: Deposit[] = [];
    let rawData = '';

    try {
      rawData = buffer.toString();

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

      if (rawData.length > 0) {
        await FileDepositService.writeBackup(viceBankPath, rawData);
      }

      await fileHandle.truncate(0);
      await fileHandle.write('[]', 0);
    }

    return new FileDepositService(fileHandle, viceBankPath, users);
  }
}
