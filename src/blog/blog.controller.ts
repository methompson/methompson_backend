import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

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
}
