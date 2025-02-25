import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryActionService } from '@/src/vice_bank/services/action.service.memory';
import { Action } from '@/src/vice_bank/models/action';
import { FileServiceWriter } from '@/src/utils/file_service_writer';
import { Deposit } from '@/src/vice_bank/models/deposit';
import { isRecord } from '@/src/utils/type_guards';
import { DepositResponse } from '@/src/vice_bank/types';

const BASE_NAME = 'action_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileActionService extends InMemoryActionService {
  constructor(
    protected readonly fileServiceWriter: FileServiceWriter,
    protected readonly viceBankPath: string,
    options?: { actions?: Action[]; deposits?: Deposit[] },
  ) {
    super(options);
  }

  get actionsString(): string {
    return JSON.stringify({
      actions: Object.values(this.actions),
      deposits: Object.values(this.deposits),
    });
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

  async addDeposit(deposit: Deposit): Promise<DepositResponse> {
    const result = await super.addDeposit(deposit);

    await this.writeToFile();

    return result;
  }

  async updateDeposit(deposit: Deposit): Promise<DepositResponse> {
    const result = await super.updateDeposit(deposit);

    await this.writeToFile();

    return result;
  }

  async deleteDeposit(depositId: string): Promise<DepositResponse> {
    const result = await super.deleteDeposit(depositId);

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

    const actionsList: Action[] = [];
    const depositsList: Deposit[] = [];

    try {
      rawData = await fileServiceWriter.readFile(viceBankPath);

      const json = JSON.parse(rawData);

      if (!isRecord(json)) {
        throw new Error('Invalid JSON data');
      }

      const { actions, deposits } = json;

      if (Array.isArray(actions)) {
        for (const val of actions) {
          try {
            actionsList.push(Action.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }

      if (Array.isArray(deposits)) {
        for (const val of deposits) {
          try {
            depositsList.push(Deposit.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }
    } catch (e) {
      try {
        if (rawData.length > 0) {
          console.error('Invalid or no data when reading file data file', e);
          const backupPath = join(viceBankPath, 'backup');
          await fileServiceWriter.writeBackup(backupPath, rawData);
        } else {
          console.error('Init: No file data found. Creating new file.');
        }

        await fileServiceWriter.clearFile(viceBankPath);
      } catch (e) {
        console.error('unable to write to disk', e);
      }
    }

    return new FileActionService(fileServiceWriter, viceBankPath, {
      actions: actionsList,
      deposits: depositsList,
    });
  }
}
