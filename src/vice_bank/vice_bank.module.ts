import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';

import { InMemoryViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service.memory';
import { InMemoryDepositConversionsService } from '@/src/vice_bank/services/deposit_conversions.service.memory';
import { InMemoryDepositService } from '@/src/vice_bank/services/deposit.service.memory';
import { InMemoryPurchaseService } from '@/src/vice_bank/services/purchase.service.memory';
import { InMemoryPurchasePricesService } from '@/src/vice_bank/services/purchase_prices.service.memory';

import { FileViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service.file';
import { FileDepositConversionsService } from '@/src/vice_bank/services/deposit_conversions.service.file';
import { FileDepositService } from '@/src/vice_bank/services/deposit.service.file';
import { FilePurchasePricesService } from '@/src/vice_bank/services/purchase_prices.service.file';
import { FilePurchaseService } from '@/src/vice_bank/services/purchase.service.file';

import { ViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service';
import { DepositConversionsService } from '@/src/vice_bank/services/deposit_conversions.service';
import { DepositService } from '@/src/vice_bank/services/deposit.service';
import { PurchasePricesService } from '@/src/vice_bank/services/purchase_prices.service';
import { PurchaseService } from '@/src/vice_bank/services/purchase.service';

import { ViceBankUserController } from '@/src/vice_bank/controllers/vice_bank_user.controller';
import { DepositController } from './controllers/deposit.controller';
import { DepositConversionsController } from './controllers/deposit_conversions.controller';
import { PurchasePricesController } from './controllers/purchase_prices.controller';
import { PurchaseController } from './controllers/purchase.controller';

import { isString } from '@/src/utils/type_guards';

const viceBankUserFactory = {
  provide: 'VICE_BANK_USER_SERVICE',
  useFactory: async (
    configService: ConfigService,
  ): Promise<ViceBankUserService> => {
    const type = configService.get('viceBankType');

    if (type === 'file') {
      const path = configService.get('viceBankFilePath');
      if (isString(path)) {
        const service = await FileViceBankUserService.init(path);
        return service;
      }
    }

    return new InMemoryViceBankUserService();
  },
  inject: [ConfigService],
};

const depositConversionsFactory = {
  provide: 'DEPOSIT_CONVERSIONS_SERVICE',
  useFactory: async (
    configService: ConfigService,
  ): Promise<DepositConversionsService> => {
    const type = configService.get('viceBankType');

    if (type === 'file') {
      const path = configService.get('viceBankFilePath');
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
    const type = configService.get('viceBankType');

    if (type === 'file') {
      const path = configService.get('viceBankFilePath');
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
    const type = configService.get('viceBankType');

    if (type === 'file') {
      const path = configService.get('viceBankFilePath');
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
    const type = configService.get('viceBankType');

    if (type === 'file') {
      const path = configService.get('viceBankUserFilePath');
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
    ViceBankUserController,
    DepositController,
    DepositConversionsController,
    PurchasePricesController,
    PurchaseController,
  ],
  providers: [
    viceBankUserFactory,
    depositConversionsFactory,
    depositFactory,
    purchasePricesFactory,
    purchaseFactory,
  ],
})
export class ViceBankModule {}
