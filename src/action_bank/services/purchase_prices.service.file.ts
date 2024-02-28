import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryPurchasePricesService } from './purchase_prices.service.memory';
import { PurchasePrice } from '@/src/models/action_bank/purchase_price';

const BASE_NAME = 'purchase_prices_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FilePurchasePricesService extends InMemoryPurchasePricesService {
  constructor(
    protected readonly fileHandle: FileHandle,
    protected readonly actionBankPath: string,
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
    const backupPath = join(this.actionBankPath, 'backup');
    await FilePurchasePricesService.writeBackup(
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
    const fileHandle = await FilePurchasePricesService.makeFileHandle(
      actionBankPath,
      filename,
    );

    await fileHandle.truncate(0);
    await fileHandle.write(rawData, 0);
    await fileHandle.close();
  }
}
