import { ConfigService } from '@nestjs/config';

const actionBankFactory = {
  provide: 'ACTION_BANK_SERVICE',
  useFactory: async (configService: ConfigService) => {
    // return new ActionBankService(loggerService);
  },
  inject: [ConfigService],
};
