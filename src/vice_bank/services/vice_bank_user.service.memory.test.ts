import * as uuid from 'uuid';

import {
  ViceBankUser,
  ViceBankUserJSON,
} from '@/src/models/vice_bank/vice_bank_user';
import { InMemoryViceBankUserService } from './vice_bank_user.service.memory';
import { isNullOrUndefined } from '@/src/utils/type_guards';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

const user1JSON: ViceBankUserJSON = {
  id: 'id1',
  name: 'name1',
  currentTokens: 1,
};
const user2JSON: ViceBankUserJSON = {
  id: 'id2',
  name: 'name2',
  currentTokens: 2,
};
const user3JSON: ViceBankUserJSON = {
  id: 'id3',
  name: 'name3',
  currentTokens: 3,
};

const user1 = ViceBankUser.fromJSON(user1JSON);
const user2 = ViceBankUser.fromJSON(user2JSON);
const user3 = ViceBankUser.fromJSON(user3JSON);

describe('InMemoryViceBankUserService', () => {
  describe('viceBankUsers', () => {
    test('returns a copy of the viceBankUsers', () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);

      const viceBankUsers = service.viceBankUsers;

      expect(viceBankUsers).toEqual({
        id1: user1,
        id2: user2,
        id3: user3,
      });
    });

    test('if there are no users, it returns an empty object', () => {
      const service = new InMemoryViceBankUserService();

      const viceBankUsers = service.viceBankUsers;

      expect(viceBankUsers).toEqual({});
      expect(Object.values(viceBankUsers).length).toBe(0);
    });

    test('revising the viceBankUsers object does not revise the stored version', () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);

      const viceBankUsers = service.viceBankUsers;

      delete viceBankUsers.id1;

      expect(Object.values(viceBankUsers).length).toBe(2);

      expect(service.viceBankUsers).toEqual({
        id1: user1,
        id2: user2,
        id3: user3,
      });
      expect(Object.values(service.viceBankUsers).length).toBe(3);
    });
  });

  describe('viceBankUsersList', () => {
    test('returns an array of viceBankUsers sorted by name', () => {
      const service = new InMemoryViceBankUserService([user3, user2, user1]);

      const list = service.viceBankUsersList;

      expect(list).toEqual([user1, user2, user3]);
    });

    test('if there are no users, it returns an empty array', () => {
      const service = new InMemoryViceBankUserService();

      const list = service.viceBankUsersList;

      expect(list).toEqual([]);
    });

    test('revising the viceBankUsersList array does not revise the stored version', () => {
      const service = new InMemoryViceBankUserService([user1, user2]);

      const list = service.viceBankUsersList;

      list.push(user3);

      expect(list.length).toBe(3);
      expect(Object.values(service.viceBankUsers).length).toBe(2);

      list.pop();
      list.pop();

      expect(list.length).toBe(1);
      expect(Object.values(service.viceBankUsers).length).toBe(2);
    });
  });

  describe('getViceBankUsers', () => {
    test('returns an array of all users if the pagination / page is less than total users', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);

      const result = await service.getViceBankUsers();

      expect(result.length).toBe(3);
      expect(result.includes(user1));
      expect(result.includes(user2));
      expect(result.includes(user3));
    });

    test('returns paginated users if there are more users than the pagination', async () => {
      const users: ViceBankUser[] = [];

      for (let i = 4; i < 10; i++) {
        const json: ViceBankUserJSON = {
          id: `id${i}`,
          name: `name${i}`,
          currentTokens: i,
        };
        const user = ViceBankUser.fromJSON(json);
        users.push(user);
      }

      const service = new InMemoryViceBankUserService([
        user1,
        user2,
        user3,
        ...users,
      ]);

      const user4 = users[0];
      const user5 = users[1];

      expect(isNullOrUndefined(user4)).toBeFalsy();
      expect(isNullOrUndefined(user5)).toBeFalsy();

      const result = await service.getViceBankUsers({ pagination: 5 });

      if (!user4 || !user5) {
        throw new Error('This should never happen');
      }

      expect(result.length).toBe(5);
      expect(result.includes(user1)).toBeTruthy();
      expect(result.includes(user2)).toBeTruthy();
      expect(result.includes(user3)).toBeTruthy();
      expect(result.includes(user4)).toBeTruthy();
      expect(result.includes(user5)).toBeTruthy();
    });

    test('goes to the proper page if a page and pagination are provided', async () => {
      const users: ViceBankUser[] = [];

      for (let i = 4; i < 10; i++) {
        const json: ViceBankUserJSON = {
          id: `id${i}`,
          name: `name${i}`,
          currentTokens: i,
        };
        const user = ViceBankUser.fromJSON(json);
        users.push(user);
      }

      const service = new InMemoryViceBankUserService([
        user1,
        user2,
        user3,
        ...users,
      ]);

      const user6 = users[2];
      const user7 = users[3];
      const user8 = users[4];
      const user9 = users[5];

      expect(isNullOrUndefined(user6)).toBeFalsy();
      expect(isNullOrUndefined(user7)).toBeFalsy();
      expect(isNullOrUndefined(user8)).toBeFalsy();
      expect(isNullOrUndefined(user9)).toBeFalsy();

      const result = await service.getViceBankUsers({
        pagination: 5,
        page: 2,
      });

      if (!user6 || !user7 || !user8 || !user9) {
        throw new Error('This should never happen');
      }

      expect(result.includes(user6)).toBeTruthy();
      expect(result.includes(user7)).toBeTruthy();
      expect(result.includes(user8)).toBeTruthy();
      expect(result.includes(user9)).toBeTruthy();
    });

    test('returns an empty array if the page is beyond the range of users', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);

      const resultA = await service.getViceBankUsers({
        page: 1,
      });
      expect(resultA.length).toBe(3);

      const resultB = await service.getViceBankUsers({
        page: 2,
      });
      expect(resultB.length).toBe(0);
    });

    test('returns a single user if an id is provided', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);

      const result = await service.getViceBankUsers({
        userId: user1.id,
      });

      expect(result.length).toBe(1);

      expect(result[0]).toBe(user1);
    });

    test('throws an error if the single user does not exist', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);

      const invalidId = 'invalid id';

      await expect(() =>
        service.getViceBankUsers({
          userId: invalidId,
        }),
      ).rejects.toThrow(`User with ID ${invalidId} not found`);
    });
  });

  describe('addViceBankUser', () => {
    test('adds a user and returns the user with the new id', async () => {
      const someId = 'someId';
      uuidv4.mockImplementationOnce(() => someId);

      const service = new InMemoryViceBankUserService([]);

      expect(service.viceBankUsersList.length).toBe(0);

      const result = await service.addViceBankUser(user1);
      expect(result.toJSON()).toEqual({
        id: someId,
        name: user1.name,
        currentTokens: user1.currentTokens,
      });

      expect(service.viceBankUsersList.length).toBe(1);
      expect(service.viceBankUsersList[0]).toBe(result);
    });
  });

  describe('updateViceBankUser', () => {
    test('replaces the user with a new user that is passed in and returns the old user', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);

      expect(service.viceBankUsersList.length).toBe(3);

      const newUser = ViceBankUser.fromJSON({
        ...user1.toJSON(),
        currentTokens: 4,
      });

      const result = await service.updateViceBankUser(newUser);

      expect(result).toBe(user1);
      expect(service.viceBankUsersList.length).toBe(3);
    });

    test('if the existing user does not exist, we throw an error', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);

      const newId = 'some invalid user Id';

      const newUser = ViceBankUser.fromJSON({
        ...user1.toJSON(),
        id: newId,
      });

      await expect(() => service.updateViceBankUser(newUser)).rejects.toThrow(
        `User with ID ${newId} not found`,
      );
    });
  });

  describe('deleteViceBankUser', () => {
    test('deletes the user from the service and returns the old user', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);

      expect(service.viceBankUsersList.length).toBe(3);
      expect(service.viceBankUsersList.includes(user1)).toBeTruthy();

      const result = await service.deleteViceBankUser(user1.id);

      expect(result).toBe(user1);
      expect(service.viceBankUsersList.length).toBe(2);
      expect(service.viceBankUsersList.includes(user1)).toBeFalsy();
    });

    test('throws an error if the id does not exist in the list of users', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);
      expect(service.viceBankUsersList.length).toBe(3);

      const badId = 'bad id';

      await expect(() => service.deleteViceBankUser(badId)).rejects.toThrow(
        `User with ID ${badId} not found`,
      );

      expect(service.viceBankUsersList.length).toBe(3);
    });
  });
});
