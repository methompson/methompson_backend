import { Request, Response } from 'express';

import { BlogController } from '@/src/blog/blog.controller';
import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { InMemoryBlogService } from '@/src/blog/blog.memory.service';
import { LoggerService } from '@/src/logger/logger.service';
import { BlogPost } from '@/src/models/blog_post_model';

// jest.mock('express');

const post1 = new BlogPost(
  'id1',
  'title1',
  'slug1',
  'body1',
  ['tag1'],
  'authorId1',
  new Date('2022-08-15'),
  {},
);

const post2 = new BlogPost(
  'id2',
  'title2',
  'slug2',
  'body2',
  ['tag2'],
  'authorId2',
  new Date('2022-08-10'),
  {},
);

describe('BlogController', () => {
  describe('getPosts', () => {
    test('returns the value returned from the blogService', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const page = 2;
      const pagination = 8;

      // Coercing this value into a Request object just to get TS to shut up
      const req = {
        query: {
          page: `${page}`,
          pagination: `${pagination}`,
        },
      } as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => ({
        posts: [post1, post2],
        morePages: false,
      }));

      const result = await controller.getPosts(req);

      expect(getPostsSpy).toHaveBeenCalledTimes(1);
      expect(getPostsSpy).toHaveBeenCalledWith(page, pagination);

      expect(result.posts.length).toBe(2);
      expect(result.morePages).toBe(false);

      const resultPost1 = result.posts[0];
      expect(resultPost1.toJSON()).toStrictEqual(post1.toJSON());

      const resultPost2 = result.posts[1];
      expect(resultPost2.toJSON()).toStrictEqual(post2.toJSON());
    });

    test('returns an empty array if the blogService returns an empty array', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {} as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => ({
        posts: [],
        morePages: false,
      }));

      const result = await controller.getPosts(req);

      expect(result.posts.length).toBe(0);
    });

    test('uses default page and pagination values if none are provided', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {} as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => ({
        posts: [],
        morePages: false,
      }));

      await controller.getPosts(req);

      expect(getPostsSpy).toHaveBeenCalledWith(1, 10);
    });

    test('uses default page and pagination values if provided values are not string numbers', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {
        query: {
          page: 100,
          pagination: 25,
        },
      } as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => ({
        posts: [],
        morePages: false,
      }));

      await controller.getPosts(req);

      expect(getPostsSpy).toHaveBeenCalledWith(1, 10);
    });

    test('throws an error if getPosts throws an error', async () => {
      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {} as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => {
        throw new Error('test error');
      });

      expect(() => controller.getPosts(req)).rejects.toThrow();
    });

    test('logs an error if getPosts throws an error', async () => {
      expect.assertions(1);

      const blogService = new InMemoryBlogService();
      const loggerService = new LoggerService([]);

      const controller = new BlogController(blogService, loggerService);

      const req = {} as unknown as Request;

      const getPostsSpy = jest.spyOn(blogService, 'getPosts');
      getPostsSpy.mockImplementationOnce(async () => {
        throw new Error('test error');
      });

      const loggerSpy = jest.spyOn(loggerService, 'addErrorLog');

      try {
        await controller.getPosts(req);
      } catch (e) {
        expect(loggerSpy).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('findBySlug', () => {});

  describe('addNewPost', () => {});
});
