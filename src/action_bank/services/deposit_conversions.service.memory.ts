import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { DepositConversion } from '@/src/models/action_bank/deposit_conversion';
import { GetPageAndUserOptions } from '@/src/action_bank/types';
import { DepositConversionsService } from './deposit_conversions.service';
import { isNullOrUndefined } from '@/src/utils/type_guards';

// Using this to get around prettier formatting the really long line below
type DCS = DepositConversionsService;

@Injectable()
export class InMemoryDepositConversionsService implements DCS {
  // Key is the ID
  protected _depositConversions: Record<string, DepositConversion> = {};

  constructor(depositConversions?: DepositConversion[]) {
    if (depositConversions) {
      for (const conversion of depositConversions) {
        this._depositConversions[conversion.id] = conversion;
      }
    }
  }

  get depositConversions(): Record<string, DepositConversion> {
    return { ...this._depositConversions };
  }

  get depositConversionsList(): DepositConversion[] {
    const list = Object.values(this._depositConversions);
    list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }

  async getDepositConversions(
    input: GetPageAndUserOptions,
  ): Promise<DepositConversion[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const { userId } = input;

    const list = this.depositConversionsList
      .filter((p) => p.userId === userId)
      .slice(skip, end);

    return list;
  }

  async addDepositConversion(
    depositConversion: DepositConversion,
  ): Promise<DepositConversion> {
    const id = uuidv4();

    const newDeposit = DepositConversion.fromNewDepositConversion(
      id,
      depositConversion,
    );
    this._depositConversions[id] = newDeposit;

    return newDeposit;
  }

  async updateDepositConversion(
    depositConversion: DepositConversion,
  ): Promise<DepositConversion> {
    const { id } = depositConversion;

    const existingDeposit = this._depositConversions[id];

    if (isNullOrUndefined(existingDeposit)) {
      throw new Error(`Deposit Conversion with ID ${id} not found`);
    }

    this._depositConversions[id] = depositConversion;

    return existingDeposit;
  }

  async deleteDepositConversion(
    depositConversionId: string,
  ): Promise<DepositConversion> {
    const depositConversion = this._depositConversions[depositConversionId];

    if (isNullOrUndefined(depositConversion)) {
      throw new Error(
        `Deposit Conversion with ID ${depositConversionId} not found`,
      );
    }

    delete this._depositConversions[depositConversionId];

    return depositConversion;
  }
}
