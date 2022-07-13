import { BlogPost, NewBlogPost } from '@src/models/blog_post_model';

export interface BlogPostRequestOutput {
  posts: BlogPost[];
  morePages: boolean;
}

export abstract class BlogPostDataController {
  abstract getPosts(
    page: number,
    pagination: number,
  ): Promise<BlogPostRequestOutput>;

  abstract getPostBySlug(slug: string): Promise<BlogPost>;

  abstract addPost(post: NewBlogPost): Promise<BlogPost>;
}
