import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { ViceBankUser } from '@/src/vice_bank/models/vice_bank_user';
import { isNullOrUndefined } from '@/src/utils/type_guards';
import { ViceBankUserService } from './vice_bank_user.service';
import { GetViceBankUsersOptions } from '@/src/vice_bank/types';
import { NotFoundError } from '@/src/errors';
import { listToObject } from '@/src/utils/array_to_obj';

@Injectable()
export class InMemoryViceBankUserService implements ViceBankUserService {
  // Key is the ID
  protected _viceBankUsers: Record<string, ViceBankUser> = {};

  constructor(users?: ViceBankUser[]) {
    if (users) {
      this._viceBankUsers = listToObject(users, (u) => u.id);
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
    const users: ViceBankUser[] = Object.values(this._viceBankUsers);

    return users.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getViceBankUsers(
    input: GetViceBankUsersOptions,
  ): Promise<ViceBankUser[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const filteredUsers = Object.values(this._viceBankUsers)
      .filter((user) => user.userId === input.userId)
      .sort((a, b) => a.name.localeCompare(b.name));

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const users = filteredUsers.slice(skip, end);

    return users;
  }

  async getViceBankUser(vbUserId: string): Promise<ViceBankUser> {
    const vbUser = this._viceBankUsers[vbUserId];

    if (isNullOrUndefined(vbUser)) {
      throw new NotFoundError(`User with ID ${vbUserId} not found`);
    }

    return vbUser;
  }

  async addViceBankUser(user: ViceBankUser): Promise<ViceBankUser> {
    const id = uuidv4();

    const newUser = ViceBankUser.fromNewViceBankUser(id, user);

    this._viceBankUsers[newUser.id] = newUser;

    return newUser;
  }

  async updateViceBankUser(newUser: ViceBankUser): Promise<ViceBankUser> {
    const { id } = newUser;

    const existingUser = this._viceBankUsers[id];

    if (isNullOrUndefined(existingUser)) {
      throw new Error(`User with ID ${id} not found`);
    }

    this._viceBankUsers[id] = newUser;

    return existingUser;
  }

  async deleteViceBankUser(viceBankUserId: string): Promise<ViceBankUser> {
    const existingUser = this._viceBankUsers[viceBankUserId];

    if (isNullOrUndefined(existingUser)) {
      throw new Error(`User with ID ${viceBankUserId} not found`);
    }

    delete this._viceBankUsers[viceBankUserId];

    return existingUser;
  }
}
