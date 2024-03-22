import { Injectable } from '@nestjs/common';

import { Action } from '@/src/models/vice_bank/action';
import { GetPageAndUserOptions } from '@/src/vice_bank/types';

@Injectable()
export abstract class ActionService {
  abstract getActions(input: GetPageAndUserOptions): Promise<Action[]>;
  abstract addAction(depositConversion: Action): Promise<Action>;
  abstract updateAction(depositConversion: Action): Promise<Action>;
  abstract deleteAction(depositConversionId: string): Promise<Action>;
}
