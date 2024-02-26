import { Injectable } from '@nestjs/common';

import { GetActionBankUsersOptions } from '@/src/action_bank/types';
import { ActionBankUser } from '@/src/models/action_bank/action_bank_user';

@Injectable()
export abstract class ActionBankUserService {
  abstract getActionBankUsers(
    input: GetActionBankUsersOptions,
  ): Promise<ActionBankUser[]>;
  abstract addActionBankUser(user: ActionBankUser): Promise<ActionBankUser>;
  abstract updateActionBankUser(user: ActionBankUser): Promise<ActionBankUser>;
  abstract deleteActionBankUser(userId: string): Promise<ActionBankUser>;
}
