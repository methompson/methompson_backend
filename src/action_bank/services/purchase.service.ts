import { Injectable } from '@nestjs/common';

import { PurchaseInputOptions } from '@/src/action_bank/types';
import { Purchase } from '@/src/models/action_bank/purchase';

@Injectable()
export abstract class PurchaseService {
  abstract getPurchases(input: PurchaseInputOptions): Promise<Purchase[]>;
  abstract addPurchase(purchase: Purchase): Promise<Purchase>;
  abstract updatePurchase(purchase: Purchase): Promise<Purchase>;
  abstract deletePurchase(purchaseId: string): Promise<Purchase>;
}
