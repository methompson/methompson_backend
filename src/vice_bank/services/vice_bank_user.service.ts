import { Injectable } from '@nestjs/common';

import { GetViceBankUsersOptions } from '@/src/vice_bank/types';
import { ViceBankUser } from '@/src/models/vice_bank/vice_bank_user';

@Injectable()
export abstract class ViceBankUserService {
  abstract getViceBankUsers(
    userId: string,
    input: GetViceBankUsersOptions,
  ): Promise<ViceBankUser[]>;
  abstract addViceBankUser(user: ViceBankUser): Promise<ViceBankUser>;
  abstract updateViceBankUser(user: ViceBankUser): Promise<ViceBankUser>;
  abstract deleteViceBankUser(
    userId: string,
    viceBankUserId: string,
  ): Promise<ViceBankUser>;
}
