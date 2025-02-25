import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';

import {
  PurchaseInputOptions,
  GetPageAndUserOptions,
} from '@/src/vice_bank/types';
import { Purchase } from '@/src/vice_bank/models/purchase';
import { PurchaseService } from './purchase.service';
import { isNullOrUndefined, isRecord } from '@/src/utils/type_guards';
import { PurchasePrice } from '@/src/vice_bank/models/purchase_price';

@Injectable()
export class InMemoryPurchaseService implements PurchaseService {
  // Key is the ID
  protected _purchases: Record<string, Purchase> = {};
  protected _purchasePrices: Record<string, PurchasePrice> = {};

  constructor(options?: {
    purchases?: Purchase[];
    purchasePrices?: PurchasePrice[];
  }) {
    if (!isRecord(options)) {
      return;
    }

    const { purchases, purchasePrices } = options;

    if (Array.isArray(purchases)) {
      for (const purchase of purchases) {
        this._purchases[purchase.id] = purchase;
      }
    }

    if (Array.isArray(purchasePrices)) {
      for (const price of purchasePrices) {
        this._purchasePrices[price.id] = price;
      }
    }
  }

  get purchases(): Record<string, Purchase> {
    return { ...this._purchases };
  }

  get purchasesList(): Purchase[] {
    const list = Object.values(this._purchases);
    list.sort((a, b) => a.date.toMillis() - b.date.toMillis());

    return list;
  }

  get purchasePrices(): Record<string, PurchasePrice> {
    return { ...this._purchasePrices };
  }

  get purchasePricesList(): PurchasePrice[] {
    const list = Object.values(this._purchasePrices);
    list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }

  async getPurchases(input: PurchaseInputOptions): Promise<Purchase[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const userId = input.userId;

    const startDate = DateTime.fromISO(input?.startDate ?? 'bad', {
      zone: 'America/Chicago',
    });
    const endDate = DateTime.fromISO(input?.endDate ?? 'bad', {
      zone: 'America/Chicago',
    });

    const purchases = this.purchasesList
      .filter((p) => {
        if (p.vbUserId !== userId) return false;
        if (startDate.isValid && p.date < startDate) return false;
        if (endDate.isValid && p.date > endDate) return false;

        return true;
      })
      .slice(skip, end);

    return purchases;
  }

  async addPurchase(purchase: Purchase): Promise<Purchase> {
    const id = uuidv4();

    const newPurchase = Purchase.fromNewPurchase(id, purchase);
    this._purchases[id] = newPurchase;

    return newPurchase;
  }

  async updatePurchase(purchase: Purchase): Promise<Purchase> {
    const { id } = purchase;

    const existingPurchase = this._purchases[id];

    if (isNullOrUndefined(existingPurchase)) {
      throw new Error(`Purchase with ID ${id} not found`);
    }

    this._purchases[id] = purchase;

    return existingPurchase;
  }

  async deletePurchase(purchaseId: string): Promise<Purchase> {
    const purchase = this._purchases[purchaseId];

    if (isNullOrUndefined(purchase)) {
      throw new Error(`Purchase with ID ${purchaseId} not found`);
    }

    delete this._purchases[purchaseId];

    return purchase;
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
      .filter((p) => p.vbUserId === userId)
      .slice(skip, end);

    return list;
  }

  async getPurchasePrice(purchasePriceId: string): Promise<PurchasePrice> {
    const price = this._purchasePrices[purchasePriceId];

    if (isNullOrUndefined(price)) {
      throw new Error(`Purchase Price with ID ${purchasePriceId} not found`);
    }

    return price;
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
