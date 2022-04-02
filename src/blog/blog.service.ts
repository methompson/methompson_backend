import { Injectable } from '@nestjs/common';

@Injectable()
export class BlogService {
  create() {}

  findAll(): Record<string, unknown>[] {
    return [];
  }

  findById(): Record<string, unknown> {
    return {
      title: 'title',
    };
  }
}
