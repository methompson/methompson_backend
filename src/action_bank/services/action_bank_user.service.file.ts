import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryActionBankUserService } from './action_bank_user.service.memory';
import { ActionBankUser } from '@/src/models/action_bank/action_bank_user';

const BASE_NAME = 'action_bank_user_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileActionBankUserService extends InMemoryActionBankUserService {
  constructor(
    protected readonly fileHandle: FileHandle,
    protected readonly actionBankPath: string,
    users?: ActionBankUser[],
  ) {
    super(users);
  }

  get actionBankUsersString(): string {
    return JSON.stringify(Object.values(this.actionBankUsers));
  }

  async addActionBankUser(user: ActionBankUser): Promise<ActionBankUser> {
    const result = await super.addActionBankUser(user);

    await this.writeToFile();

    return result;
  }

  async updateActionBankUser(user: ActionBankUser): Promise<ActionBankUser> {
    const result = await super.updateActionBankUser(user);

    await this.writeToFile();

    return result;
  }

  async deleteActionBankUser(userId: string): Promise<ActionBankUser> {
    const result = await super.deleteActionBankUser(userId);

    await this.writeToFile();

    return result;
  }

  async writeToFile(): Promise<void> {
    const postsJson = this.actionBankUsersString;

    await this.fileHandle.truncate(0);
    await this.fileHandle.write(postsJson, 0);
  }

  async backup() {
    const backupPath = join(this.actionBankPath, 'backup');
    await FileActionBankUserService.writeBackup(
      backupPath,
      this.actionBankPath,
    );
  }

  static async makeFileHandle(
    actionBankPath: string,
    name?: string,
  ): Promise<FileHandle> {
    await mkdir(actionBankPath, { recursive: true });

    const filename = name ?? FILE_NAME;

    const filepath = join(actionBankPath, filename);

    const fileHandle = await open(filepath, 'a+');

    return fileHandle;
  }

  static async writeBackup(
    actionBankPath: string,
    rawData: string,
    name?: string,
  ) {
    const filename =
      name ??
      `${BASE_NAME}_backup_${new Date().toISOString()}.${FILE_EXTENSION}`;
    const fileHandle = await FileActionBankUserService.makeFileHandle(
      actionBankPath,
      filename,
    );

    await fileHandle.truncate(0);
    await fileHandle.write(rawData, 0);
    await fileHandle.close();
  }

  static async init(
    actionBankPath: string,
  ): Promise<FileActionBankUserService> {
    const fileHandle = await FileActionBankUserService.makeFileHandle(
      actionBankPath,
    );
    const buffer = await fileHandle.readFile();

    const users: ActionBankUser[] = [];
    let rawData = '';

    try {
      rawData = buffer.toString();

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            users.push(ActionBankUser.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }
    } catch (e) {
      console.error('Invalid or no data when reading file data file', e);

      if (rawData.length > 0) {
        await FileActionBankUserService.writeBackup(actionBankPath, rawData);
      }

      await fileHandle.truncate(0);
      await fileHandle.write('[]', 0);
    }

    return new FileActionBankUserService(fileHandle, actionBankPath, users);
  }
}
