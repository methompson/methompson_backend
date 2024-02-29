import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { ActionBankUser } from '@/src/models/action_bank/action_bank_user';
import { isNullOrUndefined, isString } from '@/src/utils/type_guards';
import { ActionBankUserService } from './action_bank_user.service';
import { GetActionBankUsersOptions } from '@/src/action_bank/types';
import { NotFoundError } from '@/src/errors';

@Injectable()
export class InMemoryActionBankUserService implements ActionBankUserService {
  // Key is the ID
  protected _actionBankUsers: Record<string, ActionBankUser> = {};

  constructor(users?: ActionBankUser[]) {
    if (users) {
      for (const user of users) {
        this._actionBankUsers[user.id] = user;
      }
    }
  }

  get actionBankUsers(): Record<string, ActionBankUser> {
    return { ...this._actionBankUsers };
  }

  get actionBankUsersList(): ActionBankUser[] {
    return Object.values(this._actionBankUsers).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async getActionBankUsers(
    input?: GetActionBankUsersOptions,
  ): Promise<ActionBankUser[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;
    const userId = input?.userId;

    if (isString(userId)) {
      const user = this._actionBankUsers[userId];

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      return [user];
    }

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const users = this.actionBankUsersList.slice(skip, end);
    return users;
  }

  async addActionBankUser(user: ActionBankUser): Promise<ActionBankUser> {
    const id = uuidv4();

    const newUser = ActionBankUser.fromNewActionBankUser(id, user);
    this._actionBankUsers[id] = newUser;

    return newUser;
  }

  async updateActionBankUser(user: ActionBankUser): Promise<ActionBankUser> {
    const { id } = user;

    const existingUser = this._actionBankUsers[id];

    if (isNullOrUndefined(existingUser)) {
      throw new Error(`User with ID ${id} not found`);
    }

    this._actionBankUsers[id] = user;

    return existingUser;
  }

  async deleteActionBankUser(userId: string): Promise<ActionBankUser> {
    const user = this._actionBankUsers[userId];

    if (isNullOrUndefined(user)) {
      throw new Error(`User with ID ${userId} not found`);
    }

    delete this._actionBankUsers[userId];

    return user;
  }
}
