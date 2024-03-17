import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryViceBankUserService } from './vice_bank_user.service.memory';
import { ViceBankUser } from '@/src/models/vice_bank/vice_bank_user';

const BASE_NAME = 'vice_bank_user_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileViceBankUserService extends InMemoryViceBankUserService {
  constructor(
    protected readonly fileHandle: FileHandle,
    protected readonly viceBankPath: string,
    users?: ViceBankUser[],
  ) {
    super(users);
  }

  get viceBankUsersString(): string {
    return JSON.stringify(this.viceBankUsersList);
  }

  async addViceBankUser(user: ViceBankUser): Promise<ViceBankUser> {
    const result = await super.addViceBankUser(user);

    await this.writeToFile();

    return result;
  }

  // TODO if this fails, should we revert the change?
  async updateViceBankUser(user: ViceBankUser): Promise<ViceBankUser> {
    const result = await super.updateViceBankUser(user);

    await this.writeToFile();

    return result;
  }

  async deleteViceBankUser(
    userId: string,
    viceBankUserId: string,
  ): Promise<ViceBankUser> {
    const result = await super.deleteViceBankUser(userId, viceBankUserId);

    await this.writeToFile();

    return result;
  }

  async writeToFile(): Promise<void> {
    const postsJson = this.viceBankUsersString;

    await this.fileHandle.truncate(0);
    await this.fileHandle.write(postsJson, 0);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await FileViceBankUserService.writeBackup(
      backupPath,
      this.viceBankUsersString,
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
    const fileHandle = await FileViceBankUserService.makeFileHandle(
      viceBankPath,
      filename,
    );

    await fileHandle.truncate(0);
    await fileHandle.write(rawData, 0);
    await fileHandle.close();
  }

  static async init(viceBankPath: string): Promise<FileViceBankUserService> {
    const fileHandle = await FileViceBankUserService.makeFileHandle(
      viceBankPath,
    );
    const buffer = await fileHandle.readFile();

    const users: ViceBankUser[] = [];
    let rawData = '';

    try {
      rawData = buffer.toString();

      console.log('rawData', rawData);

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            users.push(ViceBankUser.fromJSON(val));
          } catch (e) {
            console.error('Invalid Vice Bank User: ', val, e);
          }
        }
      }
    } catch (e) {
      console.error('Invalid or no data when reading file data file', e);

      if (rawData.length > 0) {
        await FileViceBankUserService.writeBackup(viceBankPath, rawData);
      }

      await fileHandle.truncate(0);
      await fileHandle.write('[]', 0);
    }

    return new FileViceBankUserService(fileHandle, viceBankPath, users);
  }
}
