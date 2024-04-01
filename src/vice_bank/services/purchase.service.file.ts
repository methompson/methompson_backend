import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryPurchaseService } from './purchase.service.memory';
import { Purchase } from '@/src/models/vice_bank/purchase';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

import { PurchasePrice } from '@/src/models/vice_bank/purchase_price';
import { isRecord } from '@/src/utils/type_guards';

const BASE_NAME = 'purchase_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FilePurchaseService extends InMemoryPurchaseService {
  constructor(
    protected readonly fileServiceWriter: FileServiceWriter,
    protected readonly viceBankPath: string,
    options?: {
      purchases?: Purchase[];
      purchasePrices?: PurchasePrice[];
    },
  ) {
    super(options);
  }

  get purchasesString(): string {
    return JSON.stringify({
      purchases: Object.values(this.purchases),
      purchasePrices: Object.values(this.purchasePrices),
    });
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

  async addPurchasePrice(purchasePrice: PurchasePrice): Promise<PurchasePrice> {
    const result = await super.addPurchasePrice(purchasePrice);

    await this.writeToFile();

    return result;
  }

  async updatePurchasePrice(
    purchasePrice: PurchasePrice,
  ): Promise<PurchasePrice> {
    const result = await super.updatePurchasePrice(purchasePrice);

    await this.writeToFile();

    return result;
  }

  async deletePurchasePrice(purchasePriceId: string): Promise<PurchasePrice> {
    const result = await super.deletePurchasePrice(purchasePriceId);

    await this.writeToFile();

    return result;
  }

  async writeToFile(): Promise<void> {
    const json = this.purchasesString;

    await this.fileServiceWriter.writeToFile(this.viceBankPath, json);
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

    const purchasesList: Purchase[] = [];
    const pricesList: PurchasePrice[] = [];

    try {
      rawData = await fileServiceWriter.readFile(viceBankPath);

      const json = JSON.parse(rawData);

      if (!isRecord(json)) {
        throw new Error('Invalid JSON data');
      }

      const { purchases, purchasePrices } = json;

      if (Array.isArray(purchases)) {
        for (const val of purchases) {
          try {
            purchasesList.push(Purchase.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }

      if (Array.isArray(purchasePrices)) {
        for (const val of purchasePrices) {
          try {
            pricesList.push(PurchasePrice.fromJSON(val));
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

    return new FilePurchaseService(fileServiceWriter, viceBankPath, {
      purchases: purchasesList,
      purchasePrices: pricesList,
    });
  }
}
