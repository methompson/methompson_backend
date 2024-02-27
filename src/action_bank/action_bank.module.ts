import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';

import { InMemoryActionBankUserService } from '@/src/action_bank/services/action_bank_user.service.memory';
import { InMemoryDepositConversionsService } from './services/deposit_conversions.service.memory';
import { InMemoryDepositService } from './services/deposit.service.memory';
import { InMemoryPurchaseService } from './services/purchase.service.memory';
import { InMemoryPurchasePricesService } from './services/purchase_prices.service.memory';

import { ActionBankUserController } from '@/src/action_bank/controllers/action_bank_user.controller';
import { DepositController } from './controllers/deposit.controller';
import { DepositConversionsController } from './controllers/deposit_conversions.controller';
import { PurchasePricesController } from './controllers/purchase_prices.controller';
import { PurchaseController } from './controllers/purchase.controller';

const actionBankFactory = {
  provide: 'ACTION_BANK_USER_SERVICE',
  useFactory: async (_configService: ConfigService) =>
    new InMemoryActionBankUserService(),
  inject: [ConfigService],
};

const depositConversionsFactory = {
  provide: 'DEPOSIT_CONVERSIONS_SERVICE',
  useFactory: async (_configService: ConfigService) =>
    new InMemoryDepositConversionsService(),
  inject: [ConfigService],
};
const depositFactory = {
  provide: 'DEPOSIT_SERVICE',
  useFactory: async (_configService: ConfigService) =>
    new InMemoryDepositService(),
  inject: [ConfigService],
};
const purchasePricesFactory = {
  provide: 'PURCHASE_PRICES_SERVICE',
  useFactory: async (_configService: ConfigService) =>
    new InMemoryPurchasePricesService(),
  inject: [ConfigService],
};
const purchaseFactory = {
  provide: 'PURCHASE_SERVICE',
  useFactory: async (_configService: ConfigService) =>
    new InMemoryPurchaseService(),
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [
    ActionBankUserController,
    DepositController,
    DepositConversionsController,
    PurchasePricesController,
    PurchaseController,
  ],
  providers: [
    actionBankFactory,
    depositConversionsFactory,
    depositFactory,
    purchasePricesFactory,
    purchaseFactory,
  ],
})
export class ActionBankModule {}
