import { Injectable } from '@nestjs/common';

import { NewBlogPost, BlogPost } from '@src/models/blog_post_model';
import { InvalidInputError } from '@src/errors/invalid_input_error';
import { BlogPostRequestOutput } from '@src/data_controller/blog/blog_post_controller';
import { DataControllerService } from '@src/data_controller/data_controller.service';

@Injectable()
export class BlogService {
  constructor() {}

  async getPosts(
    page = 1,
    pagination = 10,
    dataController: DataControllerService,
  ): Promise<BlogPostRequestOutput> {
    return dataController.blogPostController.getPosts(page, pagination);
  }

  async findBySlug(
    slug: string,
    dataController: DataControllerService,
  ): Promise<BlogPost> {
    return await dataController.blogPostController.getPostBySlug(slug);
  }

  async addBlogPost(
    requestBody: unknown,
    dataController: DataControllerService,
  ): Promise<BlogPost> {
    if (!NewBlogPost.isNewBlogPostInterface(requestBody)) {
      throw new InvalidInputError('Invalid requesty body');
    }

    const newPost = NewBlogPost.fromJSON(requestBody);

    return dataController.blogPostController.addPost(newPost);
  }
}
