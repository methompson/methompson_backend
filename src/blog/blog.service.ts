import { BlogPost } from '@/src/models/blog_post_model';
import { BlogPostRequestOutput } from '@/src/data/blog/blog_post_controller';
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class BlogService {
  constructor() {}

  abstract getPosts(
    page: number,
    pagination: number,
  ): Promise<BlogPostRequestOutput>;

  abstract findBySlug(slug: string): Promise<BlogPost>;

  abstract addBlogPost(requestBody: unknown): Promise<BlogPost>;
}
