/* eslint-disable brace-style */

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import {
  NewBlogPost,
  BlogPost,
  BlogStatus,
} from '@/src/models/blog_post_model';
import { MutateDataException, NotFoundError } from '@/src/errors';
import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { isNullOrUndefined, isUndefined } from '@/src/utils/type_guards';
import { arrayToObject } from '@/src/utils/array_to_obj';

@Injectable()
export class InMemoryBlogService implements BlogService {
  /**
   * Blog Posts are an object of String to BlogPost. The key is the slug.
   */
  protected _blogPosts: Record<string, BlogPost> = {};

  constructor(inputPosts: BlogPost[] = []) {
    this._blogPosts = arrayToObject(inputPosts, (p) => p.slug);
  }

  get blogPosts() {
    return { ...this._blogPosts };
  }

  get blogPostsByDate(): BlogPost[] {
    const posts = Object.values(this._blogPosts);

    // Sorts in reverse chronological order
    return posts.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
  }

  get postedBlogPosts(): BlogPost[] {
    return Object.values(this.blogPosts).filter(
      (p) => p.status === BlogStatus.Posted,
    );
  }

  get postedBlogPostsByDate(): BlogPost[] {
    const posts = this.postedBlogPosts;

    return posts.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
  }

  async getPosts(page = 1, pagination = 10): Promise<BlogPostRequestOutput> {
    const skip = pagination * (page - 1);
    const end = pagination * page;

    const posts = this.postedBlogPostsByDate.slice(skip, end);

    const morePages = end < this.postedBlogPostsByDate.length;

    return {
      posts,
      morePages,
    };
  }

  async getAllPosts(page = 1, pagination = 10): Promise<BlogPostRequestOutput> {
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
    const blog = this._blogPosts[slug];

    if (isUndefined(blog)) {
      throw new NotFoundError('Blog Post Does Not Exist');
    }

    return blog;
  }

  async addBlogPost(newPost: NewBlogPost): Promise<BlogPost> {
    const id = uuidv4();
    const post = BlogPost.fromNewBlogPost(id, newPost);

    this._blogPosts[post.slug] = post;

    return post;
  }

  async updateBlogPost(
    oldSlug: string,
    updatedPost: BlogPost,
  ): Promise<BlogPost> {
    const oldBlog = this._blogPosts[oldSlug];

    if (isUndefined(oldBlog)) {
      throw new MutateDataException('Blog post does not exist. Cannot update.');
    }

    delete this._blogPosts[oldSlug];

    this._blogPosts[updatedPost.slug] = updatedPost;

    return updatedPost;
  }

  async deleteBlogPost(slug: string): Promise<BlogPost> {
    const post = this._blogPosts[slug];

    if (isNullOrUndefined(post)) {
      throw new NotFoundError('Blog Post Does Not Exist');
    }

    delete this._blogPosts[slug];

    return post;
  }

  async backup() {}
}
