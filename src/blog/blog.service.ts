import { Injectable } from '@nestjs/common';

import { BlogPost, NewBlogPost } from '@/src/models/blog_post_model';
import { Backupable } from '@/src/utils/backuppable';

export interface BlogPostRequestOutput {
  posts: BlogPost[];
  morePages: boolean;
}

@Injectable()
export abstract class BlogService implements Backupable {
  // Gets only posted posts
  abstract getPosts(
    page: number,
    pagination: number,
  ): Promise<BlogPostRequestOutput>;

  // Gets draft posts, too
  abstract getAllPosts(
    page: number,
    pagination: number,
  ): Promise<BlogPostRequestOutput>;

  abstract findBySlug(slug: string): Promise<BlogPost>;

  abstract addBlogPost(newPost: NewBlogPost): Promise<BlogPost>;

  abstract deleteBlogPost(slug: string): Promise<BlogPost>;

  abstract backup(): Promise<void>;
}
