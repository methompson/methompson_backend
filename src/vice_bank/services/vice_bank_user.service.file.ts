import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryViceBankUserService } from './vice_bank_user.service.memory';
import { ViceBankUser } from '@/src/models/vice_bank/vice_bank_user';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

const BASE_NAME = 'vice_bank_user_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileViceBankUserService extends InMemoryViceBankUserService {
  constructor(
    protected readonly fileServiceWriter: FileServiceWriter,
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
    const json = this.viceBankUsersString;

    await this.fileServiceWriter.writeToFile(this.viceBankPath, json);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await this.fileServiceWriter.writeBackup(
      backupPath,
      this.viceBankUsersString,
    );
  }

  static async init(
    viceBankPath: string,
    options?: { fileServiceWriter?: FileServiceWriter },
  ): Promise<FileViceBankUserService> {
    const fileServiceWriter =
      options?.fileServiceWriter ??
      new FileServiceWriter(BASE_NAME, FILE_EXTENSION);

    let rawData = '';

    const users: ViceBankUser[] = [];
    try {
      rawData = await fileServiceWriter.readFile(viceBankPath);

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

      try {
        if (rawData.length > 0) {
          await fileServiceWriter.writeBackup(viceBankPath, rawData);
        }

        await fileServiceWriter.clearFile();
      } catch (e) {
        console.error('unable to write to disk', e);
      }
    }

    return new FileViceBankUserService(fileServiceWriter, viceBankPath, users);
  }
}
