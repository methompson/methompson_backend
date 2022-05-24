import { Injectable } from '@nestjs/common';

import { NewBlogPost, BlogPost } from '@src/models/blog_post_model';
import { dataController } from '@src/db_controller';
import { InvalidInputError } from '@src/errors/invalid_input_error';

@Injectable()
export class BlogService {
  async getPosts(page = 1, pagination = 10): Promise<BlogPost[]> {
    return dataController.blogPostController.getPosts(page, pagination);
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    return await dataController.blogPostController.getPostBySlug(slug);
  }

  async addBlogPost(requestBody: unknown) {
    if (!NewBlogPost.isNewBlogPostInterface(requestBody)) {
      throw new InvalidInputError('Invalid requesty body');
    }

    const newPost = NewBlogPost.fromJSON(requestBody);

    await dataController.blogPostController.addPost(newPost);
  }
}
