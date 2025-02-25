import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';

import { Action } from '@/src/vice_bank/models/action';
import {
  DepositInputOptions,
  DepositResponse,
  GetPageAndUserOptions,
} from '@/src/vice_bank/types';
import { ActionService } from './action.service';
import { isNullOrUndefined, isRecord } from '@/src/utils/type_guards';
import { Deposit } from '@/src/vice_bank/models/deposit';

@Injectable()
export class InMemoryActionService implements ActionService {
  // Key is the ID
  protected _actions: Record<string, Action> = {};
  protected _deposits: Record<string, Deposit> = {};

  constructor(options?: { actions?: Action[]; deposits?: Deposit[] }) {
    if (!isRecord(options)) {
      return;
    }

    const { actions, deposits } = options;

    if (actions) {
      for (const action of actions) {
        this._actions[action.id] = action;
      }
    }

    if (deposits) {
      for (const deposit of deposits) {
        this._deposits[deposit.id] = deposit;
      }
    }
  }

  get actions(): Record<string, Action> {
    return { ...this._actions };
  }

  get actionsList(): Action[] {
    const list = Object.values(this._actions);
    list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }

  get deposits(): Record<string, Deposit> {
    return { ...this._deposits };
  }

  get depositsList(): Deposit[] {
    return Object.values(this.deposits);
  }

  async getActions(input: GetPageAndUserOptions): Promise<Action[]> {
    const page = input?.page ?? 1;
    const pagination = input?.pagination ?? 10;

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const { userId } = input;

    const list = this.actionsList
      .filter((p) => p.vbUserId === userId)
      .slice(skip, end);

    return list;
  }

  async getAction(actionId: string): Promise<Action> {
    const list = this.actionsList.filter((p) => p.id === actionId);

    const action = list[0];

    if (isNullOrUndefined(action)) {
      throw new Error(`Action with ID ${actionId} not found`);
    }

    if (list.length > 1) {
      throw new Error(`Multiple actions with ID ${actionId} found`);
    }

    return action;
  }

  async addAction(action: Action): Promise<Action> {
    const id = uuidv4();

    const newAction = Action.fromNewAction(id, action);
    this._actions[id] = newAction;

    return newAction;
  }

  async updateAction(action: Action): Promise<Action> {
    const { id } = action;

    const existingAction = this._actions[id];

    if (isNullOrUndefined(existingAction)) {
      throw new Error(`Action with ID ${id} not found`);
    }

    this._actions[id] = action;

    return existingAction;
  }

  async deleteAction(actionId: string): Promise<Action> {
    const action = this._actions[actionId];

    if (isNullOrUndefined(action)) {
      throw new Error(`Action with ID ${actionId} not found`);
    }

    delete this._actions[actionId];

    return action;
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

  async addDeposit(deposit: Deposit): Promise<DepositResponse> {
    const id = uuidv4();

    const newDeposit = Deposit.fromNewDeposit(id, deposit);
    this._deposits[id] = newDeposit;

    return {
      deposit: newDeposit,
      tokensAdded: newDeposit.tokensEarned,
    };
  }

  async updateDeposit(deposit: Deposit): Promise<DepositResponse> {
    const { id } = deposit;

    const existingDeposit = this._deposits[id];

    if (isNullOrUndefined(existingDeposit)) {
      throw new Error(`Deposit with ID ${id} not found`);
    }

    this._deposits[id] = deposit;

    return {
      deposit: existingDeposit,
      tokensAdded: deposit.tokensEarned - existingDeposit.tokensEarned,
    };
  }

  async deleteDeposit(depositId: string): Promise<DepositResponse> {
    const deposit = this._deposits[depositId];

    if (isNullOrUndefined(deposit)) {
      throw new Error(`Deposit with ID ${depositId} not found`);
    }

    delete this._deposits[depositId];

    return {
      deposit: deposit,
      tokensAdded: -1 * deposit.tokensEarned,
    };
  }
}
