import { Injectable } from '@nestjs/common';

import { DepositConversion } from '@/src/models/vice_bank/action';
import { GetPageAndUserOptions } from '@/src/vice_bank/types';

@Injectable()
export abstract class DepositConversionsService {
  abstract getDepositConversions(
    input: GetPageAndUserOptions,
  ): Promise<DepositConversion[]>;
  abstract addDepositConversion(
    depositConversion: DepositConversion,
  ): Promise<DepositConversion>;
  abstract updateDepositConversion(
    depositConversion: DepositConversion,
  ): Promise<DepositConversion>;
  abstract deleteDepositConversion(
    depositConversionId: string,
  ): Promise<DepositConversion>;
}
