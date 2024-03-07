import { Injectable } from '@nestjs/common';

import { PurchaseInputOptions } from '@/src/vice_bank/types';
import { Purchase } from '@/src/models/vice_bank/purchase';

@Injectable()
export abstract class PurchaseService {
  abstract getPurchases(input: PurchaseInputOptions): Promise<Purchase[]>;
  abstract addPurchase(purchase: Purchase): Promise<Purchase>;
  abstract updatePurchase(purchase: Purchase): Promise<Purchase>;
  abstract deletePurchase(purchaseId: string): Promise<Purchase>;
}
