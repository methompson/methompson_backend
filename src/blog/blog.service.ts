import { Injectable } from '@nestjs/common';

import { BlogPost } from '@/src/models/blog_post_model';
import { Backupable } from '@/src/utils/backuppable';

export interface BlogPostRequestOutput {
  posts: BlogPost[];
  morePages: boolean;
}

@Injectable()
export abstract class BlogService implements Backupable {
  abstract getPosts(
    page: number,
    pagination: number,
  ): Promise<BlogPostRequestOutput>;

  abstract findBySlug(slug: string): Promise<BlogPost>;

  abstract addBlogPost(requestBody: unknown): Promise<BlogPost>;

  abstract deleteBlogPost(slug: string): Promise<BlogPost>;

  abstract backup(): Promise<void>;
}
