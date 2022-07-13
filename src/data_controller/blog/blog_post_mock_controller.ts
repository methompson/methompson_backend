import { BlogPost, NewBlogPost } from '@src/models/blog_post_model';
import { BlogPostRequestOutput } from '@src/data_controller/blog/blog_post_controller';

export class BlogPostMockController {
  get mockPost(): BlogPost {
    return BlogPost.fromJSON({
      id: 'id',
      title: 'title',
      slug: 'slug',
      body: 'body',
      tags: [],
      authorId: 'id',
      dateAdded: new Date(),
    });
  }
  async getPosts(
    page: number,
    pagination: number,
  ): Promise<BlogPostRequestOutput> {
    return {
      posts: [],
      morePages: false,
    };
  }

  async getPostBySlug(slug: string): Promise<BlogPost> {
    return this.mockPost;
  }

  async addPost(post: NewBlogPost): Promise<BlogPost> {
    return this.mockPost;
  }
}
