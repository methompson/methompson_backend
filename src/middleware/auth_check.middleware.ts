import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line import/no-unresolved
import { initializeApp } from 'firebase-admin/app';
// eslint-disable-next-line import/no-unresolved
import { getAuth } from 'firebase-admin/auth';
import { AuthModel } from '../models/auth_model';

const _app = initializeApp();

@Injectable()
export class AuthCheckMiddlware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.header('authorization');
    console.log('Header', authHeader);
    let token = {};

    try {
      token = await getAuth().verifyIdToken(authHeader);
    } catch (e) {
      console.log('No authorization header', e);
    }

    res.locals.auth = new AuthModel(token);

    next();
  }
}
