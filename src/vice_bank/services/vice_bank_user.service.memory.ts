import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { ViceBankUser } from '@/src/models/vice_bank/vice_bank_user';
import { isNullOrUndefined, isString } from '@/src/utils/type_guards';
import { ViceBankUserService } from './vice_bank_user.service';
import { GetViceBankUsersOptions } from '@/src/vice_bank/types';
import { NotFoundError } from '@/src/errors';

@Injectable()
export class InMemoryViceBankUserService implements ViceBankUserService {
  // Key is the ID
  protected _viceBankUsers: Record<string, ViceBankUser> = {};

  constructor(users?: ViceBankUser[]) {
    if (users) {
      for (const user of users) {
        this._viceBankUsers[user.id] = user;
      }
    }
  }

  get viceBankUsers(): Record<string, ViceBankUser> {
    return { ...this._viceBankUsers };
  }

  get viceBankUsersList(): ViceBankUser[] {
    return Object.values(this._viceBankUsers).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async getViceBankUsers(
    input?: GetViceBankUsersOptions,
  ): Promise<ViceBankUser[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;
    const userId = input?.userId;

    if (isString(userId)) {
      const user = this._viceBankUsers[userId];

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      return [user];
    }

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const users = this.viceBankUsersList.slice(skip, end);
    return users;
  }

  async addViceBankUser(user: ViceBankUser): Promise<ViceBankUser> {
    const id = uuidv4();

    const newUser = ViceBankUser.fromNewViceBankUser(id, user);
    this._viceBankUsers[id] = newUser;

    return newUser;
  }

  async updateViceBankUser(user: ViceBankUser): Promise<ViceBankUser> {
    const { id } = user;

    const existingUser = this._viceBankUsers[id];

    if (isNullOrUndefined(existingUser)) {
      throw new Error(`User with ID ${id} not found`);
    }

    this._viceBankUsers[id] = user;

    return existingUser;
  }

  async deleteViceBankUser(userId: string): Promise<ViceBankUser> {
    const user = this._viceBankUsers[userId];

    if (isNullOrUndefined(user)) {
      throw new Error(`User with ID ${userId} not found`);
    }

    delete this._viceBankUsers[userId];

    return user;
  }
}
