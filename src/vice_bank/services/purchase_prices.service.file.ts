import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryPurchasePricesService } from './purchase_prices.service.memory';
import { PurchasePrice } from '@/src/models/vice_bank/purchase_price';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

const BASE_NAME = 'purchase_prices_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FilePurchasePricesService extends InMemoryPurchasePricesService {
  constructor(
    protected readonly fileServiceWriter: FileServiceWriter,
    protected readonly viceBankPath: string,
    input?: PurchasePrice[],
  ) {
    super(input);
  }

  get purchasePricesString(): string {
    return JSON.stringify(Object.values(this.purchasePrices));
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
    const json = this.purchasePricesString;

    await this.fileServiceWriter.writeToFile(json);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await this.fileServiceWriter.writeBackup(
      backupPath,
      this.purchasePricesString,
    );
  }

  static async init(
    viceBankPath: string,
    options?: { fileServiceWriter?: FileServiceWriter },
  ): Promise<FilePurchasePricesService> {
    const fileServiceWriter =
      options?.fileServiceWriter ??
      new FileServiceWriter(BASE_NAME, FILE_EXTENSION);

    let rawData = '';

    const users: PurchasePrice[] = [];
    try {
      rawData = await fileServiceWriter.readFile(viceBankPath);

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            users.push(PurchasePrice.fromJSON(val));
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

    return new FilePurchasePricesService(
      fileServiceWriter,
      viceBankPath,
      users,
    );
  }
}
