import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';

import { InMemoryActionBankUserService } from '@/src/action_bank/services/action_bank_user.service.memory';
import { InMemoryDepositConversionsService } from '@/src/action_bank/services/deposit_conversions.service.memory';
import { InMemoryDepositService } from '@/src/action_bank/services/deposit.service.memory';
import { InMemoryPurchaseService } from '@/src/action_bank/services/purchase.service.memory';
import { InMemoryPurchasePricesService } from '@/src/action_bank/services/purchase_prices.service.memory';

import { FileActionBankUserService } from '@/src/action_bank/services/action_bank_user.service.file';
import { FileDepositConversionsService } from '@/src/action_bank/services/deposit_conversions.service.file';
import { FileDepositService } from '@/src/action_bank/services/deposit.service.file.test';
import { FilePurchasePricesService } from '@/src/action_bank/services/purchase_prices.service.file';
import { FilePurchaseService } from '@/src/action_bank/services/purchase.service.file';

import { ActionBankUserService } from '@/src/action_bank/services/action_bank_user.service';
import { DepositConversionsService } from '@/src/action_bank/services/deposit_conversions.service';
import { DepositService } from '@/src/action_bank/services/deposit.service';
import { PurchasePricesService } from '@/src/action_bank/services/purchase_prices.service';
import { PurchaseService } from '@/src/action_bank/services/purchase.service';

import { ActionBankUserController } from '@/src/action_bank/controllers/action_bank_user.controller';
import { DepositController } from './controllers/deposit.controller';
import { DepositConversionsController } from './controllers/deposit_conversions.controller';
import { PurchasePricesController } from './controllers/purchase_prices.controller';
import { PurchaseController } from './controllers/purchase.controller';

import { isString } from '@/src/utils/type_guards';

const actionBankUserFactory = {
  provide: 'ACTION_BANK_USER_SERVICE',
  useFactory: async (
    configService: ConfigService,
  ): Promise<ActionBankUserService> => {
    const type = configService.get('actionBankType');

    if (type === 'file') {
      const path = configService.get('actionBankFilePath');
      if (isString(path)) {
        const service = await FileActionBankUserService.init(path);
        return service;
      }
    }

    return new InMemoryActionBankUserService();
  },
  inject: [ConfigService],
};

const depositConversionsFactory = {
  provide: 'DEPOSIT_CONVERSIONS_SERVICE',
  useFactory: async (
    configService: ConfigService,
  ): Promise<DepositConversionsService> => {
    const type = configService.get('actionBankType');

    if (type === 'file') {
      const path = configService.get('actionBankFilePath');
      if (isString(path)) {
        const service = await FileDepositConversionsService.init(path);
        return service;
      }
    }

    return new InMemoryDepositConversionsService();
  },
  inject: [ConfigService],
};

const depositFactory = {
  provide: 'DEPOSIT_SERVICE',
  useFactory: async (configService: ConfigService): Promise<DepositService> => {
    const type = configService.get('actionBankType');

    if (type === 'file') {
      const path = configService.get('actionBankFilePath');
      if (isString(path)) {
        const service = await FileDepositService.init(path);
        return service;
      }
    }

    return new InMemoryDepositService();
  },
  inject: [ConfigService],
};

const purchasePricesFactory = {
  provide: 'PURCHASE_PRICES_SERVICE',
  useFactory: async (
    configService: ConfigService,
  ): Promise<PurchasePricesService> => {
    const type = configService.get('actionBankType');

    if (type === 'file') {
      const path = configService.get('actionBankFilePath');
      if (isString(path)) {
        const service = await FilePurchasePricesService.init(path);
        return service;
      }
    }

    return new InMemoryPurchasePricesService();
  },
  inject: [ConfigService],
};

const purchaseFactory = {
  provide: 'PURCHASE_SERVICE',
  useFactory: async (
    configService: ConfigService,
  ): Promise<PurchaseService> => {
    const type = configService.get('actionBankType');

    if (type === 'file') {
      const path = configService.get('actionBankUserFilePath');
      if (isString(path)) {
        const service = await FilePurchaseService.init(path);
        return service;
      }
    }

    return new InMemoryPurchaseService();
  },
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
    actionBankUserFactory,
    depositConversionsFactory,
    depositFactory,
    purchasePricesFactory,
    purchaseFactory,
  ],
})
export class ActionBankModule {}
