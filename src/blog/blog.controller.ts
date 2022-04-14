import { Controller, Get, HttpException, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { InvalidInputError } from '../errors/invalid_input_error';

import { BlogService } from './blog.service';

@Controller({ path: 'api/blog' })
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Get()
  findAll(@Req() _request: Request): Record<string, unknown>[] {
    console.log('find all');
    return this.blogService.findAll();
  }

  @Get(':slug')
  findBySlug(@Req() request: Request): Record<string, unknown> {
    console.log('find by slug');
    console.log(request.query);
    return this.blogService.findBySlug('slug');
  }

  @Post()
  async addNewPost(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Record<string, unknown>> {
    // console.log('post request', request);
    // console.log('post request body', request.body);
    // console.log('Auth Value', response.locals?.auth?.authorized);

    if (!(response.locals?.auth?.authorized ?? false)) {
      throw new HttpException('Not Authorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      await this.blogService.addBlogPost(request.body);
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw new HttpException('Invalid New Blog Post Input', HttpStatus.BAD_REQUEST);
      }

      console.log(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      hello: 'world',
    };
  }
}
