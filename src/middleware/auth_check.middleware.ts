import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { decode } from 'jsonwebtoken';
// eslint-disable-next-line import/no-unresolved
import { getAuth } from 'firebase-admin/auth';

import { AuthModel, NoAuthModel } from '@/src/models/auth_model';
import { isRecord } from '@/src/utils/type_guards';

@Injectable()
class AuthCheckMiddlware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // First we attempt to get authorization from the header. Then we get it from
    // the cookies. If both fail, we get an empty string.
    const authHeader =
      req.header('authorization') ?? req.cookies?.authorization ?? '';

    // console.log('authHeader', authHeader);
    let token = {};

    try {
      token = await getAuth().verifyIdToken(authHeader);
    } catch (e) {
      // uncomment this for more logging
      // console.error('No Authorization Header', e);
    }

    res.locals.auth = new AuthModel(token);

    next();
  }
}

@Injectable()
class NoAuthCheckMiddlware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader =
      req.header('authorization') ?? req.cookies?.authorization ?? '';

    const decodedPayload = decode(authHeader);

    const token = isRecord(decodedPayload)
      ? decodedPayload
      : {
          sub: 'noAuthSub',
        };

    res.locals.auth = new NoAuthModel(token);

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

  console.log('No Auth Middleware Used');

  return NoAuthCheckMiddlware;
}
