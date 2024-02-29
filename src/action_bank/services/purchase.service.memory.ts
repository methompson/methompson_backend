import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';

import { PurchaseInputOptions } from '@/src/action_bank/types';
import { Purchase } from '@/src/models/action_bank/purchase';
import { PurchaseService } from './purchase.service';
import { isNullOrUndefined } from '@/src/utils/type_guards';

@Injectable()
export class InMemoryPurchaseService implements PurchaseService {
  // Key is the ID
  protected _purchases: Record<string, Purchase> = {};

  constructor(input?: Purchase[]) {
    if (input) {
      for (const i of input) {
        this._purchases[i.id] = i;
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
        if (p.userId !== userId) return false;
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
}
