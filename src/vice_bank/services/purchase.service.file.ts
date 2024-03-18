import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryPurchaseService } from './purchase.service.memory';
import { Purchase } from '@/src/models/vice_bank/purchase';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

const BASE_NAME = 'purchase_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FilePurchaseService extends InMemoryPurchaseService {
  constructor(
    protected readonly fileServiceWriter: FileServiceWriter,
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

    await this.fileServiceWriter.writeToFile(postsJson);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await this.fileServiceWriter.writeBackup(backupPath, this.purchasesString);
  }

  static async init(
    viceBankPath: string,
    options?: { fileServiceWriter?: FileServiceWriter },
  ): Promise<FilePurchaseService> {
    const fileServiceWriter =
      options?.fileServiceWriter ??
      new FileServiceWriter(BASE_NAME, FILE_EXTENSION);

    let rawData = '';

    const purchases: Purchase[] = [];
    try {
      rawData = await fileServiceWriter.readFile(viceBankPath);

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            purchases.push(Purchase.fromJSON(val));
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

    return new FilePurchaseService(fileServiceWriter, viceBankPath, purchases);
  }
}
