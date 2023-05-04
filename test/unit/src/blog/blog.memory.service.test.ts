import { InMemoryBlogService } from '@/src/blog/blog.service.memory';
import { BlogPost } from '@/src/models/blog_post_model';

const post1 = new BlogPost(
  'id1',
  'title1',
  'slug1',
  'body1',
  ['tag1'],
  'authorId1',
  new Date(1),
  {},
);

const post2 = new BlogPost(
  'id2',
  'title2',
  'slug2',
  'body2',
  ['tag2'],
  'authorId2',
  new Date(2),
  {},
);

const post3 = new BlogPost(
  'id3',
  'title3',
  'slug3',
  'body3',
  ['tag3'],
  'authorId3',
  new Date(3),
  {},
);

const post4 = new BlogPost(
  'id4',
  'title4',
  'slug4',
  'body4',
  ['tag4'],
  'authorId4',
  new Date(4),
  {},
);

describe('InMemoryBlogService', () => {
  describe('getPosts', () => {
    test('gets all blog posts saved', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);

      const result = await svc.getPosts();
      expect(result.posts.length).toBe(4);
      expect(result.morePages).toBe(false);

      expect(result.posts).toContain(post1);
      expect(result.posts).toContain(post2);
      expect(result.posts).toContain(post3);
      expect(result.posts).toContain(post4);
    });

    test('Pagination will split the result into two calls', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);

      const result1 = await svc.getPosts(1, 2);
      expect(result1.posts.length).toBe(2);
      expect(result1.morePages).toBe(true);
      expect(result1.posts).not.toContain(post1);
      expect(result1.posts).not.toContain(post2);
      expect(result1.posts).toContain(post3);
      expect(result1.posts).toContain(post4);

      const result2 = await svc.getPosts(2, 2);
      expect(result2.posts.length).toBe(2);
      expect(result2.morePages).toBe(false);
      expect(result2.posts).toContain(post1);
      expect(result2.posts).toContain(post2);
      expect(result2.posts).not.toContain(post3);
      expect(result2.posts).not.toContain(post4);
    });
  });

  describe('findBySlug', () => {
    test('Returns a post given a valid slug', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);

      const r1 = await svc.findBySlug(post1.slug);
      expect(r1).toBe(post1);

      const r2 = await svc.findBySlug(post2.slug);
      expect(r2).toBe(post2);

      const r3 = await svc.findBySlug(post3.slug);
      expect(r3).toBe(post3);

      const r4 = await svc.findBySlug(post4.slug);
      expect(r4).toBe(post4);
    });

    test('Throws an error if the slug does not exist', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);

      expect(() => svc.findBySlug('not a real slug')).rejects.toThrow();
    });
  });

  describe('addBlogPost', () => {
    test('Adds a blog post given a valid blog post input', async () => {
      const svc = new InMemoryBlogService();

      expect(svc.blogPostsByDate.length).toBe(0);

      const input = post1.toJSON();
      delete input.id;
      await svc.addBlogPost(input);

      expect(svc.blogPostsByDate.length).toBe(1);

      const post = svc.blogPostsByDate[0];
      expect(post.toJSON()).toStrictEqual(expect.objectContaining(input));
    });

    test('Throws an error if the input is invalid', async () => {
      const svc = new InMemoryBlogService();
      expect(() => svc.addBlogPost({})).rejects.toThrow();

      const validInput = { ...post1.toJSON() };
      delete validInput.id;

      await expect(svc.addBlogPost(validInput)).resolves.toEqual(
        expect.anything(),
      );

      let input = { ...validInput };
      delete input.title;
      expect(() => svc.addBlogPost(input)).rejects.toThrow();

      input = { ...validInput };
      delete input.slug;
      expect(() => svc.addBlogPost(input)).rejects.toThrow();

      input = { ...validInput };
      delete input.body;
      expect(() => svc.addBlogPost(input)).rejects.toThrow();

      input = { ...validInput };
      delete input.tags;
      expect(() => svc.addBlogPost(input)).rejects.toThrow();

      input = { ...validInput };
      delete input.authorId;
      expect(() => svc.addBlogPost(input)).rejects.toThrow();

      input = { ...validInput };
      delete input.dateAdded;
      expect(() => svc.addBlogPost(input)).rejects.toThrow();
    });
  });

  describe('deleteBlogPost', () => {
    test('deletes post from posts, returns post', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);
      expect(svc.blogPostsByDate.length).toBe(4);

      const result = await svc.deleteBlogPost(post1.slug);
      expect(svc.blogPostsByDate.length).toBe(3);
      expect(result.toJSON()).toStrictEqual(post1.toJSON());
    });

    test('throws an error if the slug does not exist', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);
      expect(svc.blogPostsByDate.length).toBe(4);

      await expect(() => svc.deleteBlogPost('not a slug')).rejects.toThrow();
      expect(svc.blogPostsByDate.length).toBe(4);
    });
  });
});
