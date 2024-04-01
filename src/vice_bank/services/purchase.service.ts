import { Injectable } from '@nestjs/common';

import {
  PurchaseInputOptions,
  GetPageAndUserOptions,
} from '@/src/vice_bank/types';
import { Purchase } from '@/src/models/vice_bank/purchase';
import { PurchasePrice } from '@/src/models/vice_bank/purchase_price';

@Injectable()
export abstract class PurchaseService {
  abstract getPurchases(input: PurchaseInputOptions): Promise<Purchase[]>;
  abstract addPurchase(purchase: Purchase): Promise<Purchase>;
  abstract updatePurchase(purchase: Purchase): Promise<Purchase>;
  abstract deletePurchase(purchaseId: string): Promise<Purchase>;

  abstract getPurchasePrices(
    input: GetPageAndUserOptions,
  ): Promise<PurchasePrice[]>;
  abstract getPurchasePrice(purchasePriceId: string): Promise<PurchasePrice>;
  abstract addPurchasePrice(
    purchasePrice: PurchasePrice,
  ): Promise<PurchasePrice>;
  abstract updatePurchasePrice(
    purchasePrice: PurchasePrice,
  ): Promise<PurchasePrice>;
  abstract deletePurchasePrice(purchasePriceId: string): Promise<PurchasePrice>;
}
