import { WithId, Document } from 'mongodb';

import {
  isString,
  isRecord,
  isStringArray,
  isUndefined,
  isNullOrUndefined,
} from '@/src/utils/type_guards';
import {
  isValidDate,
  isValidDateString,
  ValidDate,
} from '@/src/utils/valid_date';
import { InvalidInputError } from '@/src/errors';

export enum BlogStatus {
  Posted = 'posted',
  Draft = 'draft',
}

export function blogStatusFromString(input: unknown): BlogStatus {
  switch (input) {
    case 'draft':
      return BlogStatus.Draft;
    case 'posted':
    default:
      return BlogStatus.Posted;
  }
}

export interface NewBlogPostInterface {
  title: string;
  slug: string;
  body: string;
  tags: string[];
  authorId: string;
  dateAdded: string;
  status?: string;
  updateAuthorId?: string;
  dateUpdated?: string;
}

export interface BlogPostInterface extends NewBlogPostInterface {
  id: string;
}

interface BlogPostInputOptions {
  updateAuthorId?: string | undefined;
  dateUpdated?: ValidDate | undefined;
}

export class NewBlogPost {
  protected _updateAuthorId: string | undefined;
  protected _dateUpdated: ValidDate | undefined;

  constructor(
    protected _title: string,
    protected _slug: string,
    protected _body: string,
    protected _tags: string[],
    protected _authorId: string,
    protected _dateAdded: ValidDate,
    protected _status: BlogStatus,
    options: BlogPostInputOptions,
  ) {
    this._updateAuthorId = options.updateAuthorId ?? undefined;
    this._dateUpdated = options.dateUpdated ?? undefined;
  }

  // Protecting immutability while giving access to values
  get title(): string {
    return this._title;
  }
  get slug(): string {
    return this._slug;
  }
  get body(): string {
    return this._body;
  }
  get tags(): string[] {
    return this._tags;
  }
  get authorId(): string {
    return this._authorId;
  }
  get dateAdded(): ValidDate {
    return this._dateAdded;
  }
  get status(): BlogStatus {
    return this._status;
  }
  get updateAuthorId(): string | undefined {
    return this._updateAuthorId;
  }
  get dateUpdated(): ValidDate | undefined {
    return this._dateUpdated;
  }

  toJSON(): NewBlogPostInterface {
    const output: NewBlogPostInterface = {
      title: this.title,
      slug: this.slug,
      body: this.body,
      tags: this.tags,
      authorId: this.authorId,
      dateAdded: this.dateAdded.toISOString(),
      status: this.status,
    };

    if (!isNullOrUndefined(this.updateAuthorId)) {
      output.updateAuthorId = this.updateAuthorId;
    }
    if (!isNullOrUndefined(this.dateUpdated)) {
      output.dateUpdated = this.dateUpdated.toISOString();
    }

    return output;
  }

  static fromJSON(input: unknown): NewBlogPost {
    if (!NewBlogPost.isNewBlogPostInterface(input)) {
      const results = NewBlogPost.newBlogPostInterfaceTest(input);
      throw new InvalidInputError(`Invalid Blog Post Input: ${results.join()}`);
    }

    if (input.slug.length === 0) {
      throw new InvalidInputError('Invalid Slug');
    }

    const status = blogStatusFromString(input.status);

    const options: BlogPostInputOptions = {};

    if (
      isValidDateString(input.dateUpdated) &&
      isString(input.updateAuthorId)
    ) {
      options.dateUpdated = new Date(input.dateUpdated);
      options.updateAuthorId = input.updateAuthorId;
    }

    return new NewBlogPost(
      input.title,
      input.slug,
      input.body,
      input.tags,
      input.authorId,
      new Date(input.dateAdded),
      status,
      options,
    );
  }

  static isNewBlogPostInterface(input: unknown): input is NewBlogPostInterface {
    const result = NewBlogPost.newBlogPostInterfaceTest(input);

    return result.length === 0;
  }

  static newBlogPostInterfaceTest(input: unknown): string[] {
    const output: string[] = [];

    if (!isRecord(input)) {
      return ['root'];
    }

    // If dateAdded is not a string or the string is not a valid date, return false
    if (!isString(input.dateAdded) || !isValidDate(new Date(input.dateAdded))) {
      output.push('dateAdded');
    }

    if (!isString(input.title)) output.push('title');
    if (!isString(input.slug)) output.push('slug');
    if (!isString(input.body)) output.push('body');
    if (!isStringArray(input.tags)) output.push('tags');
    if (!isString(input.authorId)) output.push('authorId');
    if (!isString(input.status) && !isUndefined(input.status)) {
      output.push('status');
    }

    if (!isUndefined(input.updateAuthorId) && !isString(input.updateAuthorId)) {
      output.push('updateAuthorId');
    }

    if (!isUndefined(input.dateUpdated) && !isString(input.dateUpdated)) {
      output.push('dateUpdated');
    } else if (
      isString(input.dateUpdated) &&
      !isValidDate(new Date(input.dateUpdated))
    ) {
      output.push('dateUpdated');
    }

    return output;
  }
}

export class BlogPost extends NewBlogPost {
  constructor(
    protected _id: string,
    title: string,
    slug: string,
    body: string,
    tags: string[],
    authorId: string,
    dateAdded: ValidDate,
    status: BlogStatus,
    options: BlogPostInputOptions,
  ) {
    super(title, slug, body, tags, authorId, dateAdded, status, options);
  }

  get id(): string {
    return this._id;
  }

  toJSON(): BlogPostInterface {
    return {
      ...super.toJSON(),
      id: this.id,
    };
  }

  static fromJSON(input: unknown): BlogPost {
    if (!BlogPost.isBlogPostInterface(input)) {
      throw new InvalidInputError('Invalid Blog Post Input');
    }

    const newBP = NewBlogPost.fromJSON(input);

    return BlogPost.fromNewBlogPost(input.id, newBP);
  }

  static fromMongoDB(input: WithId<Document> | Document): BlogPost {
    return BlogPost.fromJSON({
      ...input,
      id: input?._id?.toString(),
    });
  }

  static isBlogPostInterface(input: unknown): input is BlogPostInterface {
    const result = BlogPost.blogPostInterfaceTest(input);

    return result.length === 0;
  }

  static blogPostInterfaceTest(input: unknown): string[] {
    const output: string[] = NewBlogPost.newBlogPostInterfaceTest(input);

    if (isRecord(input) && !isString(input.id)) output.push('id');

    return output;
  }

  static fromNewBlogPost(id: string, input: NewBlogPost): BlogPost {
    return new BlogPost(
      id,
      input.title,
      input.slug,
      input.body,
      input.tags,
      input.authorId,
      input.dateAdded,
      input.status,
      {
        dateUpdated: input.dateUpdated,
        updateAuthorId: input.updateAuthorId,
      },
    );
  }
}
