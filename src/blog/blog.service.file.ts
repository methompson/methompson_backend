/* eslint-disable brace-style */

import { FileHandle, mkdir, open } from 'fs/promises';
import path from 'path';
import { Injectable } from '@nestjs/common';

import { BlogPost } from '@/src/models/blog_post_model';
import { InMemoryBlogService } from '@/src/blog/blog.service.memory';

const BASE_NAME = 'blog_data';
const FILE_NAME = `${BASE_NAME}.json`;

@Injectable()
export class FileBlogService extends InMemoryBlogService {
  constructor(protected fileHandle: FileHandle, inputPosts: BlogPost[] = []) {
    super(inputPosts);
  }

  async addBlogPost(requestBody: unknown): Promise<BlogPost> {
    const post = await super.addBlogPost(requestBody);

    await this.writeToFile();

    return post;
  }

  async deleteBlogPost(slug: string): Promise<BlogPost> {
    const post = await super.deleteBlogPost(slug);

    await this.writeToFile();

    return post;
  }

  async writeToFile(): Promise<void> {
    const postsJson = JSON.stringify(Object.values(this.blogPosts));

    await this.fileHandle.truncate(0);
    await this.fileHandle.write(postsJson, 0);
  }

  static async makeFileHandle(
    blogPath: string,
    name?: string,
  ): Promise<FileHandle> {
    await mkdir(blogPath, {
      recursive: true,
    });

    const filename = name ?? FILE_NAME;

    const filepath = path.join(blogPath, filename);

    const fileHandle = await open(filepath, 'a+');

    return fileHandle;
  }

  static async moveOldDataToNewFile(blogPath: string, rawData: string) {
    const fileHandle = await FileBlogService.makeFileHandle(
      blogPath,
      `${BASE_NAME}_${new Date().toISOString()}.json`,
    );

    await fileHandle.write(rawData, 0);
  }

  static async init(blogPath: string): Promise<FileBlogService> {
    const fileHandle = await FileBlogService.makeFileHandle(blogPath);
    const buffer = await fileHandle.readFile();

    const blogPosts: BlogPost[] = [];
    let rawData = '';

    try {
      rawData = buffer.toString();

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            blogPosts.push(BlogPost.fromJSON(val));
          } catch (e) {
            console.error('Invalid BlogPost: ', val, e);
          }
        }
      }
    } catch (e) {
      console.error('Invalid or no data when reading file data file', e);

      if (rawData.length > 0) {
        await FileBlogService.moveOldDataToNewFile(blogPath, rawData);
      }

      await fileHandle.truncate(0);
      await fileHandle.write('[]', 0);
    }

    return new FileBlogService(fileHandle, blogPosts);
  }
}
