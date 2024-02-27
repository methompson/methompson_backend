import * as uuid from 'uuid';

import {
  DepositConversion,
  DepositConversionJSON,
} from '@/src/models/action_bank/deposit_conversion';
import { InMemoryDepositConversionsService } from './deposit_conversions.service.memory';
import { isNullOrUndefined } from '@/src/utils/type_guards';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

const conversionJSON1: DepositConversionJSON = {
  id: 'id1',
  userId: 'userId1',
  name: 'name1',
  rateName: 'rateName1',
  depositsPer: 1,
  tokensPer: 1,
  minDeposit: 1,
  maxDeposit: 1,
};
const conversionJSON2: DepositConversionJSON = {
  id: 'id2',
  userId: 'userId1',
  name: 'name2',
  rateName: 'rateName2',
  depositsPer: 2,
  tokensPer: 2,
  minDeposit: 2,
  maxDeposit: 2,
};
const conversionJSON3: DepositConversionJSON = {
  id: 'id3',
  userId: 'userId3',
  name: 'name3',
  rateName: 'rateName3',
  depositsPer: 3,
  tokensPer: 3,
  minDeposit: 3,
  maxDeposit: 3,
};

const conversion1 = DepositConversion.fromJSON(conversionJSON1);
const conversion2 = DepositConversion.fromJSON(conversionJSON2);
const conversion3 = DepositConversion.fromJSON(conversionJSON3);

describe('InMemoryDepositConversionsService', () => {
  describe('depositConversions', () => {
    test('returns a copy of the depositConversions', () => {
      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
        conversion3,
      ]);

      const conversions = service.depositConversions;

      expect(conversions).toEqual({
        id1: conversion1,
        id2: conversion2,
        id3: conversion3,
      });
    });

    test('if there are no depositConversions, it returns an empty object', () => {
      const service = new InMemoryDepositConversionsService();

      const conversions = service.depositConversions;

      expect(conversions).toEqual({});
      expect(Object.values(conversions).length).toBe(0);
    });

    test('revising the depositConversions object does not revise the stored version', () => {
      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
        conversion3,
      ]);

      const conversions = service.depositConversions;

      delete conversions.id1;

      expect(Object.values(conversions).length).toBe(2);

      expect(service.depositConversions).toEqual({
        id1: conversion1,
        id2: conversion2,
        id3: conversion3,
      });
      expect(Object.values(service.depositConversions).length).toBe(3);
    });
  });

  describe('depositConversionsList', () => {
    test('returns an array of depositConversions sorted by name', () => {
      const service = new InMemoryDepositConversionsService([
        conversion3,
        conversion2,
        conversion1,
      ]);

      const list = service.depositConversionsList;

      expect(list.length).toBe(3);
      expect(list).toEqual([conversion1, conversion2, conversion3]);
    });

    test('if there are no depositConversions, it returns an empty array', () => {
      const service = new InMemoryDepositConversionsService();

      const list = service.depositConversionsList;

      expect(list.length).toBe(0);
      expect(list).toEqual([]);
    });

    test('revising the depositConversionsList array does not revise the stored version', () => {
      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
      ]);

      const list = service.depositConversionsList;

      list.push(conversion3);

      expect(list.length).toBe(3);
      expect(service.depositConversionsList).toEqual([
        conversion1,
        conversion2,
      ]);
      expect(service.depositConversionsList.length).toBe(2);

      list.pop();
      list.pop();

      expect(list.length).toBe(1);
      expect(service.depositConversionsList).toEqual([
        conversion1,
        conversion2,
      ]);
      expect(service.depositConversionsList.length).toBe(2);
    });
  });

  describe('getDepositConversions', () => {
    test('returns an array of depositConversions', async () => {
      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
        conversion3,
      ]);

      const result1 = await service.getDepositConversions({
        userId: 'userId1',
      });
      expect(result1.length).toBe(2);
      expect(result1).toEqual([conversion1, conversion2]);

      const result2 = await service.getDepositConversions({
        userId: 'userId3',
      });
      expect(result2.length).toBe(1);
      expect(result2).toEqual([conversion3]);
    });

    test('returns paginated depositConversions if there are more conversions than the pagination', async () => {
      const conversions: DepositConversion[] = [];
      for (let i = 4; i < 10; i++) {
        conversions.push(
          DepositConversion.fromJSON({
            id: `id${i}`,
            userId: 'userId1',
            name: `name${i}`,
            rateName: `rateName${i}`,
            depositsPer: i,
            tokensPer: i,
            minDeposit: i,
            maxDeposit: i,
          }),
        );
      }

      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
        conversion3,
        ...conversions,
      ]);

      const conversion4 = conversions[0];
      const conversion5 = conversions[1];
      const conversion6 = conversions[2];

      expect(isNullOrUndefined(conversion4)).toBeFalsy();
      expect(isNullOrUndefined(conversion5)).toBeFalsy();
      expect(isNullOrUndefined(conversion6)).toBeFalsy();

      const result = await service.getDepositConversions({
        userId: 'userId1',
        pagination: 5,
      });

      expect(result.length).toBe(5);
      expect(result).toEqual([
        conversion1,
        conversion2,
        conversion4,
        conversion5,
        conversion6,
      ]);
    });

    test('goes to the proper page if a page and pagination are provided', async () => {
      const conversions: DepositConversion[] = [];
      for (let i = 4; i < 10; i++) {
        conversions.push(
          DepositConversion.fromJSON({
            id: `id${i}`,
            userId: 'userId1',
            name: `name${i}`,
            rateName: `rateName${i}`,
            depositsPer: i,
            tokensPer: i,
            minDeposit: i,
            maxDeposit: i,
          }),
        );
      }

      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
        conversion3,
        ...conversions,
      ]);

      const conversion7 = conversions[3];
      const conversion8 = conversions[4];
      const conversion9 = conversions[5];

      expect(isNullOrUndefined(conversion7)).toBeFalsy();
      expect(isNullOrUndefined(conversion8)).toBeFalsy();
      expect(isNullOrUndefined(conversion9)).toBeFalsy();

      const result = await service.getDepositConversions({
        userId: 'userId1',
        pagination: 5,
        page: 2,
      });

      expect(result.length).toBe(3);
      expect(result).toEqual([conversion7, conversion8, conversion9]);
    });

    test('returns an empty array if the page is beyond the range of conversions', async () => {
      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
        conversion3,
      ]);

      const resultA = await service.getDepositConversions({
        userId: 'userId1',
        page: 1,
      });
      expect(resultA.length).toBe(2);

      const resultB = await service.getDepositConversions({
        userId: 'userId1',
        page: 2,
      });
      expect(resultB.length).toBe(0);
    });

    test('returns an empty array if there are no conversions', async () => {
      const service = new InMemoryDepositConversionsService();

      const result = await service.getDepositConversions({
        userId: 'userId1',
      });

      expect(result.length).toBe(0);
    });

    test('returns an empty array if the user has no conversions', async () => {
      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
        conversion3,
      ]);

      const result = await service.getDepositConversions({
        userId: 'userId15',
      });

      expect(result.length).toBe(0);
    });
  });

  describe('addDepositConversion', () => {
    test('adds a depositConversion to the depositConversions', async () => {
      const someId = 'someId';
      uuidv4.mockImplementationOnce(() => someId);

      const service = new InMemoryDepositConversionsService();
      expect(service.depositConversionsList.length).toBe(0);

      const result = await service.addDepositConversion(conversion1);

      expect(result.toJSON()).toEqual({
        id: someId,
        userId: conversion1.userId,
        name: conversion1.name,
        rateName: conversion1.rateName,
        depositsPer: conversion1.depositsPer,
        tokensPer: conversion1.tokensPer,
        minDeposit: conversion1.minDeposit,
        maxDeposit: conversion1.maxDeposit,
      });
      expect(service.depositConversionsList[0]).toBe(result);
      expect(service.depositConversionsList.length).toBe(1);
    });
  });

  describe('updateDepositConversion', () => {
    test('replaces the depositConversion with a new depositConversion and returns the old conversion', async () => {
      const service = new InMemoryDepositConversionsService([conversion1]);

      const newConversion = DepositConversion.fromJSON({
        ...conversion1.toJSON(),
        maxDeposit: 100,
      });

      const result = await service.updateDepositConversion(newConversion);

      expect(result).toBe(conversion1);
      expect(service.depositConversionsList[0]).toBe(newConversion);
      expect(service.depositConversionsList.length).toBe(1);
    });

    test('throws an error if the depositConversion does not exist', async () => {
      const service = new InMemoryDepositConversionsService();

      const newConversion = DepositConversion.fromJSON({
        ...conversion1.toJSON(),
        id: 'invalid id',
      });

      await expect(() =>
        service.updateDepositConversion(newConversion),
      ).rejects.toThrow(
        `Deposit Conversion with ID ${newConversion.id} not found`,
      );
    });
  });

  describe('deleteDepositConversion', () => {
    test('deletes the depositConversion and returns the deleted conversion', async () => {
      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
        conversion3,
      ]);

      expect(service.depositConversionsList.length).toBe(3);
      expect(service.depositConversionsList.includes(conversion1)).toBeTruthy();

      const result = await service.deleteDepositConversion(conversion1.id);

      expect(result).toBe(conversion1);
      expect(service.depositConversionsList.length).toBe(2);
      expect(service.depositConversionsList.includes(conversion1)).toBeFalsy();
    });

    test('throws an error if the depositConversion does not exist', async () => {
      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
        conversion3,
      ]);

      const badId = 'bad id';

      await expect(() =>
        service.deleteDepositConversion(badId),
      ).rejects.toThrow(`Deposit Conversion with ID ${badId} not found`);
    });
  });
});
