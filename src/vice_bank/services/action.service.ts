import { Injectable } from '@nestjs/common';

import { Action } from '@/src/models/vice_bank/action';
import {
  GetPageAndUserOptions,
  DepositInputOptions,
} from '@/src/vice_bank/types';
import { Deposit } from '@/src/models/vice_bank/deposit';

@Injectable()
export abstract class ActionService {
  abstract getActions(input: GetPageAndUserOptions): Promise<Action[]>;
  abstract addAction(depositConversion: Action): Promise<Action>;
  abstract updateAction(depositConversion: Action): Promise<Action>;
  abstract deleteAction(depositConversionId: string): Promise<Action>;

  abstract getDeposits(input: DepositInputOptions): Promise<Deposit[]>;
  abstract addDeposit(deposit: Deposit): Promise<Deposit>;
  abstract updateDeposit(deposit: Deposit): Promise<Deposit>;
  abstract deleteDeposit(depositId: string): Promise<Deposit>;
}
