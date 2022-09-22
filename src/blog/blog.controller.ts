import {
  Controller,
  Inject,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { BlogPost } from '@/src/models/blog_post_model';
import { InvalidInputError } from '@/src/errors/invalid_input_error';
import { isString } from '@/src/utils/type_guards';

import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { LoggerService } from '@/src/logger/logger.service';
import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { AuthRequiredIncerceptor } from '@/src/middleware/auth_interceptor';

@UseInterceptors(RequestLogInterceptor)
@Controller({ path: 'api/blog' })
export class BlogController {
  constructor(
    @Inject('BLOG_SERVICE')
    private readonly blogService: BlogService,
    @Inject('LOGGER_SERVICE')
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  async getPosts(@Req() request: Request): Promise<BlogPostRequestOutput> {
    const pageQP = request.query?.page;
    const paginationQP = request.query?.pagination;

    let page = 1;
    let pagination = 10;

    if (isString(pageQP)) {
      const parsedInt = Number.parseInt(pageQP, 10);
      if (!Number.isNaN(parsedInt)) {
        page = parsedInt;
      }
    }

    if (isString(paginationQP)) {
      const parsedInt = Number.parseInt(paginationQP, 10);
      if (!Number.isNaN(parsedInt)) {
        pagination = parsedInt;
      }
    }

    try {
      return await this.blogService.getPosts(page, pagination);
    } catch (e) {
      await this.loggerService.addErrorLog(e);
      throw e;
    }
  }

  @Get(':slug')
  async findBySlug(@Req() request: Request): Promise<BlogPost> {
    const slug = request.params?.slug;

    if (!isString(slug) || slug.length === 0) {
      throw new HttpException('Invalid Slug', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.blogService.findBySlug(slug);
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw new HttpException('No Blog Post', HttpStatus.NOT_FOUND);
      }

      console.error(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @UseInterceptors(AuthRequiredIncerceptor)
  async addNewPost(@Req() request: Request): Promise<BlogPost> {
    try {
      return await this.blogService.addBlogPost(request.body);
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw new HttpException(
          'Invalid New Blog Post Input',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.error(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
