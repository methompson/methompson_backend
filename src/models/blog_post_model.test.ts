import {
  BlogPost,
  BlogPostInterface,
  BlogStatus,
  NewBlogPost,
  NewBlogPostInterface,
  blogStatusFromString,
} from '@/src/models/blog_post_model';

describe('blogStatusFromString', () => {
  test('returns a blog status for a valid string input', () => {
    expect(blogStatusFromString('posted')).toBe(BlogStatus.Posted);
    expect(blogStatusFromString('draft')).toBe(BlogStatus.Draft);
  });

  test('returns a posted status for an invalid string input', () => {
    expect(blogStatusFromString('')).toBe(BlogStatus.Posted);
    expect(blogStatusFromString('test')).toBe(BlogStatus.Posted);
  });
});

describe('NewBlogPost', () => {
  const validPost: NewBlogPostInterface = {
    title: 'title',
    slug: 'slug',
    body: 'body',
    tags: ['tag1', 'tag2'],
    authorId: 'authorId',
    dateAdded: '2022-04-14T08:05:00.000Z',
    status: 'draft',
    updateAuthorId: 'updateAuthorId',
    dateUpdated: '2022-04-14T08:06:00.000Z',
  };

  describe('constructor', () => {});

  describe('toJSON', () => {
    test('returns an expected value', () => {
      const newPost = NewBlogPost.fromJSON(validPost);
      expect(newPost.toJSON()).toStrictEqual(validPost);
    });
  });

  describe('fromJSON', () => {
    test('returns a new blog post', () => {
      const newPost = NewBlogPost.fromJSON(validPost);
      expect(newPost.toJSON()).toStrictEqual(validPost);
    });

    test('returns a new blog post if updateAuthorId or dateUpdated is missing', () => {
      const expectation = { ...validPost };
      delete expectation.updateAuthorId;
      delete expectation.dateUpdated;

      let input: Record<string, unknown>;

      input = { ...validPost };
      delete input.updateAuthorId;
      const newPost1 = NewBlogPost.fromJSON(input);
      expect(newPost1.toJSON()).toStrictEqual(expectation);

      input = { ...validPost };
      delete input.dateUpdated;
      const newPost2 = NewBlogPost.fromJSON(input);
      expect(newPost2.toJSON()).toStrictEqual(expectation);

      input = { ...validPost };
      delete input.updateAuthorId;
      delete input.dateUpdated;
      const newPost3 = NewBlogPost.fromJSON(input);
      expect(newPost3.toJSON()).toStrictEqual(expectation);
    });

    test('returns a new blog post with default status if it is missing', () => {
      const input = { ...validPost };
      delete input.status;

      const newPost = NewBlogPost.fromJSON(input);
      expect(newPost.toJSON()).toStrictEqual({
        ...validPost,
        status: 'posted',
      });
    });

    test('throws an error if required items are missing', () => {
      let input: Record<string, unknown>;

      input = { ...validPost };
      delete input.title;
      expect(() => NewBlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.slug;
      expect(() => NewBlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.body;
      expect(() => NewBlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.tags;
      expect(() => NewBlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.authorId;
      expect(() => NewBlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.dateAdded;
      expect(() => NewBlogPost.fromJSON(input)).toThrow();
    });

    test('throws an error if slug is empty', () => {
      const input = { ...validPost };
      input.slug = '';
      expect(() => NewBlogPost.fromJSON(input)).toThrow();
    });

    test('throws an error if invalid input is provided', () => {
      expect(() => NewBlogPost.fromJSON(1)).toThrow();
      expect(() => NewBlogPost.fromJSON('1')).toThrow();
      expect(() => NewBlogPost.fromJSON({})).toThrow();
      expect(() => NewBlogPost.fromJSON([])).toThrow();
      expect(() => NewBlogPost.fromJSON(null)).toThrow();
      expect(() => NewBlogPost.fromJSON(undefined)).toThrow();
      expect(() => NewBlogPost.fromJSON(new Date())).toThrow();
    });
  });

  describe('isNewBlogPostInterface', () => {
    test('returns true if the input conforms to a NewBlogPostInterface', () => {
      expect(NewBlogPost.isNewBlogPostInterface(validPost)).toBe(true);
    });

    test('returns true if status is missing', () => {
      const newPost = { ...validPost };
      delete newPost.status;

      expect(NewBlogPost.isNewBlogPostInterface(newPost)).toBe(true);
    });

    test('returns true if update information is missing', () => {
      const newPost = { ...validPost };
      delete newPost.updateAuthorId;
      delete newPost.dateUpdated;

      expect(NewBlogPost.isNewBlogPostInterface(newPost)).toBe(true);
    });

    test('returns true if updateAuthorId is present, but not dateUpdated', () => {
      const newPost = { ...validPost };
      delete newPost.updateAuthorId;

      expect(NewBlogPost.isNewBlogPostInterface(newPost)).toBe(true);
    });

    test('returns true if dateUpdate is present, but not updateAuthorId', () => {
      const newPost = { ...validPost };
      delete newPost.dateUpdated;

      expect(NewBlogPost.isNewBlogPostInterface(newPost)).toBe(true);
    });

    test('returns false if any of the required values are missing', () => {
      let alias: Record<string, unknown>;

      alias = { ...validPost };
      delete alias.title;
      expect(NewBlogPost.isNewBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.slug;
      expect(NewBlogPost.isNewBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.body;
      expect(NewBlogPost.isNewBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.authorId;
      expect(NewBlogPost.isNewBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.dateAdded;
      expect(NewBlogPost.isNewBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.tags;
      expect(NewBlogPost.isNewBlogPostInterface(alias)).toBe(false);
    });

    test('returns false if dateAdded is not a valid timestamp', () => {
      const alias = { ...validPost };
      alias.dateAdded = 'abc';
      expect(NewBlogPost.isNewBlogPostInterface(alias)).toBe(false);
    });
  });
});

describe('BlogPost', () => {
  const validPost: BlogPostInterface = {
    id: 'id',
    title: 'title',
    slug: 'slug',
    body: 'body',
    tags: ['tag1', 'tag2'],
    authorId: 'authorId',
    dateAdded: '2022-04-14T08:05:00.000Z',
    status: 'posted',
    updateAuthorId: 'updateAuthorId',
    dateUpdated: '2022-04-14T08:06:00.000Z',
  };

  describe('constructor', () => {});

  describe('toJSON', () => {
    test('returns an expected value', () => {
      const newPost = BlogPost.fromJSON(validPost);
      expect(newPost.toJSON()).toStrictEqual(validPost);
    });
  });

  describe('fromJSON', () => {
    test('returns a blog post', () => {
      const newPost = BlogPost.fromJSON(validPost);
      expect(newPost.toJSON()).toStrictEqual(validPost);
    });

    test('returns a blog post if updateAuthorId or dateUpdated is missing', () => {
      const expectation = { ...validPost };
      delete expectation.updateAuthorId;
      delete expectation.dateUpdated;

      let input: Record<string, unknown>;

      input = { ...validPost };
      delete input.updateAuthorId;
      const newPost1 = BlogPost.fromJSON(input);
      expect(newPost1.toJSON()).toStrictEqual(expectation);

      input = { ...validPost };
      delete input.dateUpdated;
      const newPost2 = BlogPost.fromJSON(input);
      expect(newPost2.toJSON()).toStrictEqual(expectation);

      input = { ...validPost };
      delete input.updateAuthorId;
      delete input.dateUpdated;
      const newPost3 = BlogPost.fromJSON(input);
      expect(newPost3.toJSON()).toStrictEqual(expectation);
    });

    test('returns a blog post with default status if it is missing', () => {
      const input = { ...validPost };
      delete input.status;

      const newPost = BlogPost.fromJSON(input);
      expect(newPost.toJSON()).toStrictEqual({
        ...validPost,
        status: 'posted',
      });
    });

    test('throws an error if required items are missing', () => {
      let input: Record<string, unknown>;

      input = { ...validPost };
      delete input.id;
      expect(() => BlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.title;
      expect(() => BlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.slug;
      expect(() => BlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.body;
      expect(() => BlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.tags;
      expect(() => BlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.authorId;
      expect(() => BlogPost.fromJSON(input)).toThrow();

      input = { ...validPost };
      delete input.dateAdded;
      expect(() => BlogPost.fromJSON(input)).toThrow();
    });

    test('throws an error if slug is empty', () => {
      const input = { ...validPost };
      input.slug = '';
      expect(() => BlogPost.fromJSON(input)).toThrow();
    });

    test('throws an error if invalid input is provided', () => {
      expect(() => BlogPost.fromJSON(1)).toThrow();
      expect(() => BlogPost.fromJSON('1')).toThrow();
      expect(() => BlogPost.fromJSON({})).toThrow();
      expect(() => BlogPost.fromJSON([])).toThrow();
      expect(() => BlogPost.fromJSON(null)).toThrow();
      expect(() => BlogPost.fromJSON(undefined)).toThrow();
      expect(() => BlogPost.fromJSON(new Date())).toThrow();
    });
  });

  describe('isBlogPostInterface', () => {
    test('returns true if the input conforms to a BlogPostInterface', () => {
      expect(BlogPost.isBlogPostInterface(validPost)).toBe(true);
    });

    test('returns true if status is missing', () => {
      const newPost = { ...validPost };
      delete newPost.status;

      expect(BlogPost.isBlogPostInterface(newPost)).toBe(true);
    });

    test('returns true if update information is missing', () => {
      const newPost = { ...validPost };
      delete newPost.updateAuthorId;
      delete newPost.dateUpdated;

      expect(BlogPost.isBlogPostInterface(newPost)).toBe(true);
    });

    test('returns true if updateAuthorId is present, but not dateUpdated', () => {
      const newPost = { ...validPost };
      delete newPost.updateAuthorId;

      expect(BlogPost.isBlogPostInterface(newPost)).toBe(true);
    });

    test('returns true if dateUpdate is present, but not updateAuthorId', () => {
      const newPost = { ...validPost };
      delete newPost.dateUpdated;

      expect(BlogPost.isBlogPostInterface(newPost)).toBe(true);
    });

    test('returns false if any of the required values are missing', () => {
      let alias: Record<string, unknown>;

      alias = { ...validPost };
      delete alias.id;
      expect(BlogPost.isBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.title;
      expect(BlogPost.isBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.slug;
      expect(BlogPost.isBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.body;
      expect(BlogPost.isBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.authorId;
      expect(BlogPost.isBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.dateAdded;
      expect(BlogPost.isBlogPostInterface(alias)).toBe(false);

      alias = { ...validPost };
      delete alias.tags;
      expect(BlogPost.isBlogPostInterface(alias)).toBe(false);
    });
  });
});
