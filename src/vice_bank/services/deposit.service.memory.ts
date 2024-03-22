import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';

import { DepositInputOptions } from '@/src/vice_bank/types';
import { DepositService } from './deposit.service';
import { Deposit } from '@/src/models/vice_bank/deposit';
import { isNullOrUndefined } from '@/src/utils/type_guards';

@Injectable()
export class InMemoryDepositService implements DepositService {
  // Key is the ID
  protected _deposits: Record<string, Deposit> = {};

  constructor(deposits?: Deposit[]) {
    if (deposits) {
      for (const i of deposits) {
        this._deposits[i.id] = i;
      }
    }
  }

  get deposits(): Record<string, Deposit> {
    return { ...this._deposits };
  }

  get depositsList(): Deposit[] {
    return Object.values(this.deposits);
  }

  async getDeposits(input: DepositInputOptions): Promise<Deposit[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const userId = input.userId;

    const startDate = DateTime.fromISO(input?.startDate ?? 'bad', {
      zone: 'America/Chicago',
    });
    const endDate = DateTime.fromISO(input?.endDate ?? 'bad', {
      zone: 'America/Chicago',
    });

    const deposits = this.depositsList.filter((d) => {
      if (d.vbUserId !== userId) return false;
      if (startDate.isValid && d.date < startDate) return false;
      if (endDate.isValid && d.date > endDate) return false;

      return true;
    });

    deposits.sort((a, b) => a.date.toMillis() - b.date.toMillis());
    const output = deposits.slice(skip, end);

    return output;
  }

  async addDeposit(deposit: Deposit): Promise<Deposit> {
    const id = uuidv4();

    const newDeposit = Deposit.fromNewDeposit(id, deposit);
    this._deposits[id] = newDeposit;

    return newDeposit;
  }

  async updateDeposit(deposit: Deposit): Promise<Deposit> {
    const { id } = deposit;

    const existingDeposit = this._deposits[id];

    if (isNullOrUndefined(existingDeposit)) {
      throw new Error(`Deposit with ID ${id} not found`);
    }

    this._deposits[id] = deposit;

    return existingDeposit;
  }

  async deleteDeposit(depositId: string): Promise<Deposit> {
    const deposit = this._deposits[depositId];

    if (isNullOrUndefined(deposit)) {
      throw new Error(`Deposit with ID ${depositId} not found`);
    }

    delete this._deposits[depositId];

    return deposit;
  }
}
