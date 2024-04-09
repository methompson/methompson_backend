import { Injectable } from '@nestjs/common';

import { Action } from '@/src/vice_bank/models/action';
import {
  GetPageAndUserOptions,
  DepositInputOptions,
  DepositResponse,
} from '@/src/vice_bank/types';
import { Deposit } from '@/src/vice_bank/models/deposit';

@Injectable()
export abstract class ActionService {
  abstract getActions(input: GetPageAndUserOptions): Promise<Action[]>;
  abstract getAction(actionId: string): Promise<Action>;
  abstract addAction(action: Action): Promise<Action>;
  abstract updateAction(action: Action): Promise<Action>;
  abstract deleteAction(actionId: string): Promise<Action>;

  abstract getDeposits(input: DepositInputOptions): Promise<Deposit[]>;
  abstract addDeposit(deposit: Deposit): Promise<DepositResponse>;
  abstract updateDeposit(deposit: Deposit): Promise<DepositResponse>;
  abstract deleteDeposit(depositId: string): Promise<DepositResponse>;
}
