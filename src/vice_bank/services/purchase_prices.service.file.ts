import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryPurchasePricesService } from './purchase_prices.service.memory';
import { PurchasePrice } from '@/src/models/vice_bank/purchase_price';

const BASE_NAME = 'purchase_prices_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FilePurchasePricesService extends InMemoryPurchasePricesService {
  constructor(
    protected readonly fileHandle: FileHandle,
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
    const postsJson = this.purchasePricesString;

    await this.fileHandle.truncate(0);
    await this.fileHandle.write(postsJson, 0);
  }

  async backup() {
    const backupPath = join(this.viceBankPath, 'backup');
    await FilePurchasePricesService.writeBackup(
      backupPath,
      this.purchasePricesString,
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
    const fileHandle = await FilePurchasePricesService.makeFileHandle(
      viceBankPath,
      filename,
    );

    await fileHandle.truncate(0);
    await fileHandle.write(rawData, 0);
    await fileHandle.close();
  }

  static async init(viceBankPath: string): Promise<FilePurchasePricesService> {
    const fileHandle = await FilePurchasePricesService.makeFileHandle(
      viceBankPath,
    );
    const buffer = await fileHandle.readFile();

    const users: PurchasePrice[] = [];
    let rawData = '';

    try {
      rawData = buffer.toString();

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

      if (rawData.length > 0) {
        await FilePurchasePricesService.writeBackup(viceBankPath, rawData);
      }

      await fileHandle.truncate(0);
      await fileHandle.write('[]', 0);
    }

    return new FilePurchasePricesService(fileHandle, viceBankPath, users);
  }
}
