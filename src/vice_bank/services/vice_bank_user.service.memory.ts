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
  protected _viceBankUsers: Record<string, Record<string, ViceBankUser>> = {};

  constructor(users?: ViceBankUser[]) {
    if (users) {
      this._viceBankUsers = this.convertListToRecord(users);
    }
  }

  get viceBankUsers(): Record<string, Record<string, ViceBankUser>> {
    const output: Record<string, Record<string, ViceBankUser>> = {};

    Object.entries(this._viceBankUsers).forEach(([userId, users]) => {
      output[userId] = { ...users };
    });

    return output;
  }

  get viceBankUsersList(): ViceBankUser[] {
    const users: ViceBankUser[] = [];

    for (const u of Object.values(this._viceBankUsers)) {
      users.push(...Object.values(u));
    }

    return users.sort((a, b) => a.name.localeCompare(b.name));
  }

  convertListToRecord(
    users: ViceBankUser[],
  ): Record<string, Record<string, ViceBankUser>> {
    const result: Record<string, Record<string, ViceBankUser>> = {};

    for (const user of users) {
      const usersByUserId = result[user.userId] ?? {};
      usersByUserId[user.id] = user;
      result[user.userId] = usersByUserId;
    }

    return result;
  }

  async getViceBankUsers(
    userId: string,
    input?: GetViceBankUsersOptions,
  ): Promise<ViceBankUser[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;
    const viceBankUserId = input?.userId;

    if (isString(viceBankUserId)) {
      const users = this._viceBankUsers[userId];
      const user = users?.[viceBankUserId];

      if (isNullOrUndefined(user)) {
        throw new NotFoundError(`User with ID ${viceBankUserId} not found`);
      }

      return [user];
    }

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const allUsers = Object.values(this._viceBankUsers[userId] ?? {});

    const users = allUsers.slice(skip, end);
    return users;
  }

  async addViceBankUser(user: ViceBankUser): Promise<ViceBankUser> {
    const id = uuidv4();

    const newUser = ViceBankUser.fromNewViceBankUser(id, user);

    const users = this._viceBankUsers[newUser.userId] ?? {};

    users[id] = newUser;
    this._viceBankUsers[newUser.userId] = users;

    return newUser;
  }

  async updateViceBankUser(user: ViceBankUser): Promise<ViceBankUser> {
    const { id, userId } = user;

    const existingUsers = this._viceBankUsers[userId];
    const existingUser = this._viceBankUsers[userId]?.[id];

    if (isNullOrUndefined(existingUser) || isNullOrUndefined(existingUsers)) {
      throw new Error(`User with ID ${id} not found`);
    }

    existingUsers[id] = user;
    this._viceBankUsers[userId] = existingUsers;

    return existingUser;
  }

  async deleteViceBankUser(
    userId: string,
    viceBankuserId: string,
  ): Promise<ViceBankUser> {
    const existingUsers = this._viceBankUsers[userId];
    const existingUser = existingUsers?.[viceBankuserId];

    if (isNullOrUndefined(existingUser) || isNullOrUndefined(existingUsers)) {
      throw new Error(`User with ID ${viceBankuserId} not found`);
    }

    delete existingUsers[viceBankuserId];
    this._viceBankUsers[userId] = existingUsers;

    return existingUser;
  }
}
