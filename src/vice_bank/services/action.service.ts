import { Injectable } from '@nestjs/common';

import { Action } from '@/src/models/vice_bank/action';
import { GetPageAndUserOptions } from '@/src/vice_bank/types';

@Injectable()
export abstract class DepositConversionsService {
  abstract getDepositConversions(
    input: GetPageAndUserOptions,
  ): Promise<Action[]>;
  abstract addDepositConversion(depositConversion: Action): Promise<Action>;
  abstract updateDepositConversion(depositConversion: Action): Promise<Action>;
  abstract deleteDepositConversion(
    depositConversionId: string,
  ): Promise<Action>;
}
