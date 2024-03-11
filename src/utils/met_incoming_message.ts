import { Request } from 'express';

import { AuthModel, NoAuthModel } from '@/src/models/auth_model';

export interface METIncomingMessage extends Request {
  authModel: AuthModel | NoAuthModel | undefined;
}
