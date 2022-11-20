import {
  Controller,
  Inject,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { BlogPost } from '@/src/models/blog_post_model';
import { InvalidInputError } from '@/src/errors/invalid_input_error';
import { isString } from '@/src/utils/type_guards';

import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { LoggerService } from '@/src/logger/logger.service';
import { RequestLogInterceptor } from '@/src/middleware/request_log.interceptor';
import { AuthRequiredIncerceptor } from '@/src/middleware/auth_interceptor';
import { getIntFromString } from '@/src/utils/get_number_from_string';

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

    const page = isString(pageQP) ? getIntFromString(pageQP, 1) : 1;
    const pagination = isString(paginationQP)
      ? getIntFromString(paginationQP, 10)
      : 10;

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

  @Post('delete/:slug')
  @UseInterceptors(AuthRequiredIncerceptor)
  async deleteBlogPost(@Req() request: Request): Promise<BlogPost> {
    const slug = request.params?.slug;

    if (!isString(slug) || slug.length === 0) {
      throw new HttpException('Invalid Slug', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.blogService.deleteBlogPost(slug);
    } catch (e) {
      if (e instanceof InvalidInputError) {
        throw new HttpException('No Blog Post', HttpStatus.NOT_FOUND);
      }

      console.error(e);

      throw new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
