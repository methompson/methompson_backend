import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { Action } from '@/src/models/vice_bank/action';
import { GetPageAndUserOptions } from '@/src/vice_bank/types';
import { ActionService } from './action.service';
import { isNullOrUndefined } from '@/src/utils/type_guards';

@Injectable()
export class InMemoryActionService implements ActionService {
  // Key is the ID
  protected _actions: Record<string, Action> = {};

  constructor(actions?: Action[]) {
    if (actions) {
      for (const conversion of actions) {
        this._actions[conversion.id] = conversion;
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
}
