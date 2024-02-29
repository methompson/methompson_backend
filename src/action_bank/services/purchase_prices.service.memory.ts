import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { GetPageAndUserOptions } from '@/src/action_bank/types';
import { PurchasePrice } from '@/src/models/action_bank/purchase_price';
import { PurchasePricesService } from './purchase_prices.service';
import { isNullOrUndefined } from '@/src/utils/type_guards';

@Injectable()
export class InMemoryPurchasePricesService implements PurchasePricesService {
  // Key is the ID
  protected _purchasePrices: Record<string, PurchasePrice> = {};

  constructor(input?: PurchasePrice[]) {
    if (input) {
      for (const i of input) {
        this._purchasePrices[i.id] = i;
      }
    }
  }

  get purchasePrices(): Record<string, PurchasePrice> {
    return { ...this._purchasePrices };
  }

  get purchasePricesList(): PurchasePrice[] {
    const list = Object.values(this._purchasePrices);
    list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }

  async getPurchasePrices(
    input: GetPageAndUserOptions,
  ): Promise<PurchasePrice[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const { userId } = input;

    const list = this.purchasePricesList
      .filter((p) => p.userId === userId)
      .slice(skip, end);

    return list;
  }

  async addPurchasePrice(purchasePrice: PurchasePrice): Promise<PurchasePrice> {
    const id = uuidv4();

    const newPurchasePrice = PurchasePrice.fromNewPurchasePrice(
      id,
      purchasePrice,
    );
    this._purchasePrices[id] = newPurchasePrice;

    return newPurchasePrice;
  }

  async updatePurchasePrice(
    purchasePrice: PurchasePrice,
  ): Promise<PurchasePrice> {
    const { id } = purchasePrice;

    const existing = this._purchasePrices[id];

    if (isNullOrUndefined(existing)) {
      throw new Error(`Purchase Price with ID ${id} not found`);
    }

    this._purchasePrices[id] = purchasePrice;

    return existing;
  }

  async deletePurchasePrice(purchasePriceId: string): Promise<PurchasePrice> {
    const purchasePrice = this._purchasePrices[purchasePriceId];

    if (isNullOrUndefined(purchasePrice)) {
      throw new Error(`Purchase Price with ID ${purchasePriceId} not found`);
    }

    delete this._purchasePrices[purchasePriceId];

    return purchasePrice;
  }
}
