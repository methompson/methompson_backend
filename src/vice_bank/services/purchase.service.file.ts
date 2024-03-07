import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryPurchaseService } from './purchase.service.memory';
import { Purchase } from '@/src/models/vice_bank/purchase';

const BASE_NAME = 'purchase_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FilePurchaseService extends InMemoryPurchaseService {
  constructor(
    protected readonly fileHandle: FileHandle,
    protected readonly viceBankPath: string,
    input?: Purchase[],
  ) {
    super(input);
  }

  get purchasesString(): string {
    return JSON.stringify(Object.values(this.purchases));
  }

  async addPurchase(purchase: Purchase): Promise<Purchase> {
    const result = await super.addPurchase(purchase);

    await this.writeToFile();

    return result;
  }

  async updatePurchase(purchase: Purchase): Promise<Purchase> {
    const result = await super.updatePurchase(purchase);

    await this.writeToFile();

    return result;
  }

  async deletePurchase(purchaseId: string): Promise<Purchase> {
    const result = await super.deletePurchase(purchaseId);

    await this.writeToFile();

    return result;
  }

  async writeToFile(): Promise<void> {
    const postsJson = this.purchasesString;

    await this.fileHandle.truncate(0);
    await this.fileHandle.write(postsJson, 0);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await FilePurchaseService.writeBackup(backupPath, this.viceBankPath);
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
    const fileHandle = await FilePurchaseService.makeFileHandle(
      viceBankPath,
      filename,
    );

    await fileHandle.truncate(0);
    await fileHandle.write(rawData, 0);
    await fileHandle.close();
  }

  static async init(viceBankPath: string): Promise<FilePurchaseService> {
    const fileHandle = await FilePurchaseService.makeFileHandle(viceBankPath);
    const buffer = await fileHandle.readFile();

    const users: Purchase[] = [];
    let rawData = '';

    try {
      rawData = buffer.toString();

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            users.push(Purchase.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }
    } catch (e) {
      console.error('Invalid or no data when reading file data file', e);

      if (rawData.length > 0) {
        await FilePurchaseService.writeBackup(viceBankPath, rawData);
      }

      await fileHandle.truncate(0);
      await fileHandle.write('[]', 0);
    }

    return new FilePurchaseService(fileHandle, viceBankPath, users);
  }
}
