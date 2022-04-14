import { Injectable } from '@nestjs/common';

import { NewBlogPost } from '@src/models/blog_post_model';
import { dataController } from '@src/db_controller';
import { InvalidInputError } from '@src/errors/invalid_input_error';

@Injectable()
export class BlogService {
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

  findBySlug(_slug: string): Record<string, unknown> {
    return {
      title: 'title',
    };
  }

  async addBlogPost(requestBody: unknown) {
    if (!NewBlogPost.isNewBlogPostInterface(requestBody)) {
      throw new InvalidInputError('Invalid requesty body');
    }

    const newPost = NewBlogPost.fromJSON(requestBody);

    await dataController.blogPostController.addPost(newPost);
  }
}
