import { Injectable } from '@nestjs/common';

import { dataController } from '@src/db_controller/';

@Injectable()
export class BlogService {
  create() {}

  findAll(): Record<string, unknown>[] {
    return [];
  }

  findById(): Record<string, unknown> {
    const result = dataController.test;
    console.log('result', result);

    return {
      title: 'title',
    };
  }
}
