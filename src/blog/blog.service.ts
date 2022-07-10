import { Injectable } from '@nestjs/common';

import { NewBlogPost, BlogPost } from '@src/models/blog_post_model';
import { dataController } from '@src/db_controller';
import { InvalidInputError } from '@src/errors/invalid_input_error';
import { BlogPostRequestOutput } from '@src/db_controller/blog_post_db_controller';

@Injectable()
export class BlogService {
  async getPosts(page = 1, pagination = 10): Promise<BlogPostRequestOutput> {
    return dataController.blogPostController.getPosts(page, pagination);
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    return await dataController.blogPostController.getPostBySlug(slug);
  }

  async addBlogPost(requestBody: unknown): Promise<BlogPost> {
    if (!NewBlogPost.isNewBlogPostInterface(requestBody)) {
      throw new InvalidInputError('Invalid requesty body');
    }

    const newPost = NewBlogPost.fromJSON(requestBody);

    return dataController.blogPostController.addPost(newPost);
  }
}
