import { isString, isRecord } from '@src/utils/type_guards';
import { isValidDate, ValidDate } from '@src/utils/valid_date';
import { InvalidInputError } from '@src/errors/invalid_input_error';

interface BlogPostInterface {
  id: string;
  title: string;
  slug: string;
  body: string;
  tags: string[];
  authorId: string;
  dateAdded: ValidDate;
  updateAuthorId?: string;
  dateUpdated?: ValidDate;
}

interface BlogPostInputOptions {
  updateAuthorId?: string;
  dateUpdated?: ValidDate;
}

class BlogPost {
  protected _updateAuthorId: string | null;
  protected _dateUpdated: ValidDate | null;

  constructor(
    protected _id: string,
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
  get id(): string {
    return this._id;
  }
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

  toJSON(): BlogPostInterface {
    const output: BlogPostInterface = {
      id: this.id,
      title: this.title,
      slug: this.slug,
      body: this.body,
      tags: this.tags,
      authorId: this.authorId,
      dateAdded: this.dateAdded,
    };

    if (this.updateAuthorId !== null) {
      output.updateAuthorId = this.updateAuthorId;
    }
    if (this.dateUpdated !== null) {
      output.dateUpdated = this.dateUpdated;
    }

    return output;
  }

  static fromJSON(input: unknown): BlogPost {
    if (!BlogPost.isBlogPostInterface(input)) {
      throw new InvalidInputError('Invalid Blog Post Input');
    }

    const options: BlogPostInputOptions = {};

    if (isValidDate(input.dateUpdated)) {
      options.dateUpdated = input.dateUpdated;
    }

    if (isString(input.updateAuthorId)) {
      options.updateAuthorId = input.updateAuthorId;
    }

    return new BlogPost(
      input.id,
      input.title,
      input.slug,
      input.body,
      input.tags,
      input.authorId,
      input.dateAdded,
      options,
    );
  }

  static isBlogPostInterface(value: unknown): value is BlogPostInterface {
    if (!isRecord(value)) {
      return false;
    }

    // We test each value in tags to determine if they're a string
    if (Array.isArray(value.tags)) {
      for (const t of value.tags) {
        if (!isString(t)) {
          return false;
        }
      }
    } else {
      // If not an array, just return false
      return false;
    }

    return isString(value.id)
      && isString(value.title)
      && isString(value.slug)
      && isString(value.body)
      && isString(value.authorId)
      && isValidDate(value.dateAdded)
      && (isString(value.updateAuthorId) || value.updateAuthorId === undefined)
      && (isValidDate(value.dateUpdated) || value.dateUpdated === undefined);
  }
}

export {
  BlogPost,
};