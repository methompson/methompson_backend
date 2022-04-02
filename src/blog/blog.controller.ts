import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

import { BlogService } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Get()
  findAll(@Req() request: Request): Record<string, unknown> {
    return this.blogService.findById();
  }
}
