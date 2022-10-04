/* eslint-disable brace-style */

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { NewBlogPost, BlogPost } from '@/src/models/blog_post_model';
import { InvalidInputError } from '@/src/errors/invalid_input_error';
import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { isNullOrUndefined, isUndefined } from '@/src/utils/type_guards';
import { NotFoundError } from '@/src/errors';

@Injectable()
export class InMemoryBlogService implements BlogService {
  /**
   * Blog Posts are an object of String to BlogPost. The key is the slug.
   */
  protected blogPosts: Record<string, BlogPost> = {};

  constructor(inputPosts: BlogPost[] = []) {
    for (const post of inputPosts) {
      this.blogPosts[post.slug] = post;
    }
  }

  get blogPostsByDate(): BlogPost[] {
    const posts = Object.values(this.blogPosts);

    // Sorts in reverse chronological order
    return posts.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
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
      throw new NotFoundError('Blog Post Does Not Exist');
    }

    return blog;
  }

  async addBlogPost(requestBody: unknown): Promise<BlogPost> {
    if (!NewBlogPost.isNewBlogPostInterface(requestBody)) {
      throw new InvalidInputError('Invalid request body');
    }

    const newPost = NewBlogPost.fromJSON(requestBody);

    const id = uuidv4();
    const blog = BlogPost.fromNewBlogPost(id, newPost);

    this.blogPosts[blog.slug] = blog;

    return blog;
  }

  async deleteBlogPost(slug: string): Promise<BlogPost> {
    const post = this.blogPosts[slug];

    if (isNullOrUndefined(post)) {
      throw new NotFoundError('Blog Post Does Not Exist');
    }

    delete this.blogPosts[slug];

    return post;
  }
}
