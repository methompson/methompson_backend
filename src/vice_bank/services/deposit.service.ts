import { Injectable } from '@nestjs/common';

import { DepositInputOptions } from '@/src/vice_bank/types';
import { Deposit } from '@/src/models/vice_bank/deposit';

@Injectable()
export abstract class DepositService {
  abstract getDeposits(input: DepositInputOptions): Promise<Deposit[]>;
  abstract addDeposit(deposit: Deposit): Promise<Deposit>;
  abstract updateDeposit(deposit: Deposit): Promise<Deposit>;
  abstract deleteDeposit(depositId: string): Promise<Deposit>;
}
