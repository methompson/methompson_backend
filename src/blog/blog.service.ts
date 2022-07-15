import { Injectable } from '@nestjs/common';

import { BlogPost } from '@/src/models/blog_post_model';

export interface BlogPostRequestOutput {
  posts: BlogPost[];
  morePages: boolean;
}

@Injectable()
export abstract class BlogService {
  abstract getPosts(
    page: number,
    pagination: number,
  ): Promise<BlogPostRequestOutput>;

  abstract findBySlug(slug: string): Promise<BlogPost>;

  abstract addBlogPost(requestBody: unknown): Promise<BlogPost>;
}
