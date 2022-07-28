/* eslint-disable brace-style */

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { NewBlogPost, BlogPost } from '@/src/models/blog_post_model';
import { InvalidInputError } from '@/src/errors/invalid_input_error';
import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { isUndefined } from '@/src/utils/type_guards';

@Injectable()
export class InMemoryBlogService implements BlogService {
  /**
   * Blog Posts are an object of String to BlogPost. The key is the slug.
   */
  protected blogPosts: Record<string, BlogPost> = {};

  get blogPostsByDate(): BlogPost[] {
    const posts = Object.values(this.blogPosts);

    posts.sort((a, b) => {
      const aTime = a.dateAdded.getTime();
      const bTime = b.dateAdded.getTime();

      if (aTime > bTime) {
        return -1;
      }

      if (aTime < bTime) {
        return 1;
      }

      return 0;
    });

    return posts;
  }

  async getPosts(page = 1, pagination = 10): Promise<BlogPostRequestOutput> {
    const skip = pagination * (page - 1);
    const end = pagination * page;

    const posts = this.blogPostsByDate.slice(skip, end);

    const morePages = end < this.blogPostsByDate.length;

    return {
      posts,
      morePages,
    };
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    const blog = this.blogPosts[slug];

    if (isUndefined(blog)) {
      throw new Error('Blog Does Not Exist');
    }

    return blog;
  }

  async addBlogPost(requestBody: unknown): Promise<BlogPost> {
    if (!NewBlogPost.isNewBlogPostInterface(requestBody)) {
      throw new InvalidInputError('Invalid requesty body');
    }

    const newPost = NewBlogPost.fromJSON(requestBody);

    const id = uuidv4();
    const blog = BlogPost.fromNewBlogPost(id, newPost);

    this.blogPosts[blog.slug] = blog;

    return blog;
  }
}
