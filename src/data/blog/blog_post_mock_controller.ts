import { BlogPost } from '@/src/models/blog_post_model';
import { BlogPostRequestOutput } from '@/src/data/blog/blog_post_controller';

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
  async getPosts(): Promise<BlogPostRequestOutput> {
    return {
      posts: [],
      morePages: false,
    };
  }

  async getPostBySlug(): Promise<BlogPost> {
    return this.mockPost;
  }

  async addPost(): Promise<BlogPost> {
    return this.mockPost;
  }
}
