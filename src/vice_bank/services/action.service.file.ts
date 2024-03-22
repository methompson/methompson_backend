import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryActionService } from '@/src/vice_bank/services/action.service.memory';
import { Action } from '@/src/models/vice_bank/action';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

const BASE_NAME = 'action_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileActionService extends InMemoryActionService {
  constructor(
    protected readonly fileServiceWriter: FileServiceWriter,
    protected readonly viceBankPath: string,
    actions?: Action[],
  ) {
    super(actions);
  }

  get actionsString(): string {
    return JSON.stringify(Object.values(this.actions));
  }

  async addAction(action: Action): Promise<Action> {
    const result = super.addAction(action);

    await this.writeToFile();

    return result;
  }

  async updateAction(action: Action): Promise<Action> {
    const result = await super.updateAction(action);

    await this.writeToFile();

    return result;
  }

  async deleteAction(actionId: string): Promise<Action> {
    const result = await super.deleteAction(actionId);

    await this.writeToFile();

    return result;
  }

  async writeToFile(): Promise<void> {
    const json = this.actionsString;

    await this.fileServiceWriter.writeToFile(this.viceBankPath, json);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await this.fileServiceWriter.writeBackup(backupPath, this.actionsString);
  }

  static async init(
    viceBankPath: string,
    options?: { fileServiceWriter?: FileServiceWriter },
  ): Promise<FileActionService> {
    const fileServiceWriter =
      options?.fileServiceWriter ??
      new FileServiceWriter(BASE_NAME, FILE_EXTENSION);

    let rawData = '';

    const actions: Action[] = [];
    try {
      rawData = await fileServiceWriter.readFile(viceBankPath);

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            actions.push(Action.fromJSON(val));
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

    return new FileActionService(fileServiceWriter, viceBankPath, actions);
  }
}
