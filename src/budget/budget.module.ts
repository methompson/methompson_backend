import { ConfigService, ConfigModule } from '@nestjs/config';
import { FactoryProvider, Module } from '@nestjs/common';

import { LoggerModule } from '@/src/logger/logger.module';

import { InMemoryBudgetService } from './services/budget.service.memory';
import { BudgetController } from './controllers/budget.controller';
import { FileBudgetService } from './services/budget.service.file';

const budgetFactory: FactoryProvider = {
  provide: 'BUDGET_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('budgetType');

    if (type === 'file') {
      const path = configService.get('budgetFilePath');
      if (typeof path === 'string') {
        const service = await FileBudgetService.init(path);
        return service;
      }
    }

    return new InMemoryBudgetService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [BudgetController],
  providers: [budgetFactory],
})
export class BudgetModule {}
