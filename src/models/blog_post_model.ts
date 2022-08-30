import { WithId, Document } from 'mongodb';

import { isString, isRecord, isStringArray } from '@/src/utils/type_guards';
import { isValidDate, ValidDate } from '@/src/utils/valid_date';
import { InvalidInputError } from '@/src/errors/invalid_input_error';

interface NewBlogPostInterface {
  title: string;
  slug: string;
  body: string;
  tags: string[];
  authorId: string;
  dateAdded: string;
  updateAuthorId?: string;
  dateUpdated?: string;
}

interface BlogPostInterface {
  [key: string]: unknown;
  id: string;
  title: string;
  slug: string;
  body: string;
  tags: string[];
  authorId: string;
  dateAdded: string;
  updateAuthorId?: string;
  dateUpdated?: string;
}

interface BlogPostInputOptions {
  updateAuthorId?: string;
  dateUpdated?: ValidDate;
}

class NewBlogPost {
  protected _updateAuthorId: string | null;
  protected _dateUpdated: ValidDate | null;

  constructor(
    protected _title: string,
    protected _slug: string,
    protected _body: string,
    protected _tags: string[],
    protected _authorId: string,
    protected _dateAdded: ValidDate,
    options: BlogPostInputOptions,
  ) {
    this._updateAuthorId = options.updateAuthorId ?? null;
    this._dateUpdated = options.dateUpdated ?? null;
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
  get updateAuthorId(): string | null {
    return this._updateAuthorId;
  }
  get dateUpdated(): ValidDate | null {
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
    };

    if (this.updateAuthorId !== null) {
      output.updateAuthorId = this.updateAuthorId;
    }
    if (this.dateUpdated !== null) {
      output.dateUpdated = this.dateUpdated.toDateString();
    }

    return output;
  }

  static fromJSON(input: unknown): NewBlogPost {
    if (!NewBlogPost.isNewBlogPostInterface(input)) {
      throw new InvalidInputError('Invalid Blog Post Input');
    }

    if (input.slug.length === 0) {
      throw new InvalidInputError('Invalid Slug');
    }

    const options: BlogPostInputOptions = {};

    if (isValidDate(input.dateUpdated)) {
      options.dateUpdated = input.dateUpdated;
    }

    if (isString(input.updateAuthorId)) {
      options.updateAuthorId = input.updateAuthorId;
    }

    return new NewBlogPost(
      input.title,
      input.slug,
      input.body,
      input.tags,
      input.authorId,
      new Date(input.dateAdded),
      options,
    );
  }

  static isNewBlogPostInterface(value: unknown): value is NewBlogPostInterface {
    if (!isRecord(value)) {
      return false;
    }

    // If dateAdded is not a string or the string is not a valid date, return false
    if (!isString(value.dateAdded) || !isValidDate(new Date(value.dateAdded))) {
      return false;
    }

    // If dateUpdated IS a string, but is not a valid date, return false
    if (
      isString(value.dateUpdated) &&
      !isValidDate(new Date(value.dateUpdated))
    ) {
      return false;
    }

    return (
      isString(value.title) &&
      isString(value.slug) &&
      isString(value.body) &&
      isString(value.authorId) &&
      isStringArray(value.tags) &&
      ((isString(value.updateAuthorId) && isString(value.dateUpdated)) ||
        (value.updateAuthorId === undefined && value.dateUpdated === undefined))
    );
  }
}

class BlogPost extends NewBlogPost {
  constructor(
    protected _id: string,
    title: string,
    slug: string,
    body: string,
    tags: string[],
    authorId: string,
    dateAdded: ValidDate,
    options: BlogPostInputOptions,
  ) {
    super(title, slug, body, tags, authorId, dateAdded, options);
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

  static isBlogPostInterface(value: unknown): value is BlogPostInterface {
    return (
      isRecord(value) &&
      isString(value.id) &&
      NewBlogPost.isNewBlogPostInterface(value)
    );
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
      {
        dateUpdated: input.dateUpdated,
        updateAuthorId: input.updateAuthorId,
      },
    );
  }
}

export { NewBlogPost, BlogPost };
