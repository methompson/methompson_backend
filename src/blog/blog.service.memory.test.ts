import { InMemoryBlogService } from '@/src/blog/blog.service.memory';
import {
  BlogPost,
  BlogStatus,
  NewBlogPost,
} from '@/src/models/blog_post_model';

const post1 = new BlogPost(
  'id1',
  'title1',
  'slug1',
  'body1',
  ['tag1'],
  'authorId1',
  new Date(1),
  BlogStatus.Draft,
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
  BlogStatus.Draft,
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
  BlogStatus.Posted,
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
  BlogStatus.Posted,
  {},
);

describe('InMemoryBlogService', () => {
  describe('constructor', () => {
    test('constructs a map of slugs to blog posts', () => {
      const imbs = new InMemoryBlogService([post1, post2, post3, post4]);

      expect(imbs.blogPosts[post1.slug]).toBe(post1);
      expect(imbs.blogPosts[post2.slug]).toBe(post2);
      expect(imbs.blogPosts[post3.slug]).toBe(post3);
      expect(imbs.blogPosts[post4.slug]).toBe(post4);
    });
  });

  describe('getPosts', () => {
    test('gets all posted blog posts saved', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);

      const result = await svc.getPosts();
      expect(result.posts.length).toBe(2);
      expect(result.morePages).toBe(false);

      expect(result.posts).not.toContain(post1);
      expect(result.posts).not.toContain(post2);
      expect(result.posts).toContain(post3);
      expect(result.posts).toContain(post4);
    });

    test('Pagination will split the result into two calls', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);

      const result1 = await svc.getPosts(1, 1);
      expect(result1.posts.length).toBe(1);
      expect(result1.morePages).toBe(true);
      expect(result1.posts).not.toContain(post3);
      expect(result1.posts).toContain(post4);

      const result2 = await svc.getPosts(2, 1);
      expect(result2.posts.length).toBe(1);
      expect(result2.morePages).toBe(false);
      expect(result2.posts).toContain(post3);
      expect(result2.posts).not.toContain(post4);
    });
  });

  describe('getAllPosts', () => {
    test('gets all blog posts saved', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);

      const result = await svc.getAllPosts();
      expect(result.posts.length).toBe(4);
      expect(result.morePages).toBe(false);

      expect(result.posts).toContain(post1);
      expect(result.posts).toContain(post2);
      expect(result.posts).toContain(post3);
      expect(result.posts).toContain(post4);
    });

    test('Pagination will split the result into two calls', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);

      const result1 = await svc.getAllPosts(1, 2);
      expect(result1.posts.length).toBe(2);
      expect(result1.morePages).toBe(true);
      expect(result1.posts).not.toContain(post1);
      expect(result1.posts).not.toContain(post2);
      expect(result1.posts).toContain(post3);
      expect(result1.posts).toContain(post4);

      const result2 = await svc.getAllPosts(2, 2);
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

      const input: Record<string, unknown> =
        post1.toJSON() as unknown as Record<string, unknown>;
      delete input.id;

      const newPost = NewBlogPost.fromJSON(input);

      await svc.addBlogPost(newPost);

      expect(svc.blogPostsByDate.length).toBe(1);

      const post = svc.blogPostsByDate[0];
      expect(post?.toJSON()).toStrictEqual(expect.objectContaining(input));
    });
  });

  describe('updateBlogPost', () => {
    test('replaces the old post with the updated post', async () => {
      const svc = new InMemoryBlogService([post1, post2, post3, post4]);
      const body = 'updated body';
      const updatedPost1 = BlogPost.fromJSON({
        ...post1.toJSON(),
        body,
      });

      expect(svc.blogPosts[post1.slug]).toBe(post1);

      const post = await svc.updateBlogPost(post1.slug, updatedPost1);

      expect(post).toBe(updatedPost1);

      expect(svc.blogPosts[post1.slug]).toBe(updatedPost1);
      expect(svc.blogPosts[post1.slug]?.body).toBe(body);
    });

    test("throws an error if the updated post's slug does not exist in the current set", async () => {
      const svc = new InMemoryBlogService([]);
      expect(svc.blogPosts[post1.slug]).toBeUndefined();

      await expect(() => svc.updateBlogPost(post1.slug, post1)).rejects.toThrow(
        'Blog post does not exist. Cannot update.',
      );
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
