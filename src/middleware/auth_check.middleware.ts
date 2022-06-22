import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { decode } from 'jsonwebtoken';

// eslint-disable-next-line import/no-unresolved
import { initializeApp } from 'firebase-admin/app';
// eslint-disable-next-line import/no-unresolved
import { getAuth } from 'firebase-admin/auth';

import { AuthModel } from '@src/models/auth_model';
import { isRecord } from '@src/utils/type_guards';

const _app = initializeApp();

@Injectable()
class AuthCheckMiddlware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.header('authorization') ?? '';

    let token = {};

    try {
      token = await getAuth().verifyIdToken(authHeader);
    } catch (e) {
      // uncomment this for better logging later on
      // console.log('No authorization header', e);
    }

    res.locals.auth = new AuthModel(token);

    next();
  }
}

@Injectable()
class NoAuthCheckMiddlware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.header('authorization');

    const decodedPayload = decode(authHeader);

    const token = isRecord(decodedPayload) ? decodedPayload : {};

    res.locals.auth = new AuthModel(token);

    next();
  }
}

export function authCheckMiddlewareFactory() {
  let auth = true;
  process.argv.forEach((el) => {
    if (el === 'noauth') {
      auth = false;
    }
  });

  if (auth) {
    return AuthCheckMiddlware;
  }

  console.log('No Auth');

  return NoAuthCheckMiddlware;
}
