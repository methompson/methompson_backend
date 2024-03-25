import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';

import { InMemoryViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service.memory';
import { InMemoryActionService } from '@/src/vice_bank/services/action.service.memory';
import { InMemoryPurchaseService } from '@/src/vice_bank/services/purchase.service.memory';

import { FileViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service.file';
import { FileActionService } from '@/src/vice_bank/services/action.service.file';
import { FilePurchaseService } from '@/src/vice_bank/services/purchase.service.file';

import { ViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service';
import { ActionService } from '@/src/vice_bank/services/action.service';
import { PurchaseService } from '@/src/vice_bank/services/purchase.service';

import { ViceBankUserController } from '@/src/vice_bank/controllers/vice_bank_user.controller';
import { ActionController } from './controllers/action.controller';
import { PurchaseController } from './controllers/purchase.controller';

import { TaskController } from './controllers/task.controller';
import { TaskService } from './services/task.service';
import { FileTaskService } from './services/task_service.file';
import { InMemoryTaskService } from './services/task_service.memory';

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

const actionsFactory = {
  provide: 'ACTION_SERVICE',
  useFactory: async (configService: ConfigService): Promise<ActionService> => {
    const type = configService.get('viceBankType');

    if (type === 'file') {
      const path = configService.get('viceBankFilePath');
      if (isString(path)) {
        const service = await FileActionService.init(path);
        return service;
      }
    }

    return new InMemoryActionService();
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
      const path = configService.get('viceBankFilePath');
      if (isString(path)) {
        const service = await FilePurchaseService.init(path);
        return service;
      }
    }

    return new InMemoryPurchaseService();
  },
  inject: [ConfigService],
};

const taskFactory = {
  provide: 'TASK_SERVICE',
  useFactory: async (configService: ConfigService): Promise<TaskService> => {
    const type = configService.get('viceBankType');

    if (type === 'file') {
      const path = configService.get('viceBankFilePath');
      if (isString(path)) {
        const service = await FileTaskService.init(path);
        return service;
      }
    }

    return new InMemoryTaskService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [
    ViceBankUserController,
    ActionController,
    PurchaseController,
    TaskController,
  ],
  providers: [
    viceBankUserFactory,
    actionsFactory,
    purchaseFactory,
    taskFactory,
  ],
})
export class ViceBankModule {}
