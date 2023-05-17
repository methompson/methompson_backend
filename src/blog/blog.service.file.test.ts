import { mkdir, open } from 'fs/promises';
import { Buffer } from 'node:buffer';
import { join } from 'path';

import { FILE_NAME, FileBlogService } from '@/src/blog/blog.service.file';
import {
  BlogPost,
  BlogStatus,
  NewBlogPost,
} from '@/src/models/blog_post_model';

jest.mock('fs/promises', () => {
  const mkdir = jest.fn();
  const open = jest.fn();

  return {
    mkdir,
    open,
  };
});

const closeMock = jest.fn();
const readFileMock = jest.fn();
const truncateMock = jest.fn();
const writeMock = jest.fn();

function MockFileHandle() {}
MockFileHandle.prototype.close = closeMock;
MockFileHandle.prototype.readFile = readFileMock;
MockFileHandle.prototype.truncate = truncateMock;
MockFileHandle.prototype.write = writeMock;

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
  BlogStatus.Posted,
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
  BlogStatus.Draft,
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

const mockOpen = open as unknown as jest.Mock;
const mockMkdir = mkdir as unknown as jest.Mock;

const testError = 'test error aoisdhfjnk';

const logSpy = jest.spyOn(console, 'log');
logSpy.mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

describe('FileBlogService', () => {
  const makeFileHandleSpy = jest.spyOn(FileBlogService, 'makeFileHandle');
  const writeBackupSpy = jest.spyOn(FileBlogService, 'writeBackup');

  beforeEach(() => {
    closeMock.mockReset();
    readFileMock.mockReset();
    truncateMock.mockReset();
    writeMock.mockReset();
    mockMkdir.mockReset();
    mockOpen.mockReset();

    makeFileHandleSpy.mockClear();
    writeBackupSpy.mockClear();
  });

  describe('addBlogPost', () => {
    const newPost = NewBlogPost.fromJSON(post1.toJSON());

    test('Adds a blog post given a valid blog post input', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileBlogService(await open(''), 'path');

      expect(svc.blogPostsByDate.length).toBe(0);

      await svc.addBlogPost(newPost);

      expect(svc.blogPostsByDate.length).toBe(1);

      const post = svc.blogPostsByDate[0];
      expect(post.toJSON()).toStrictEqual(
        expect.objectContaining(newPost.toJSON()),
      );
    });

    test('Runs writeToFile', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileBlogService(await open(''), 'path');

      const writeToFileSpy = jest.spyOn(svc, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await svc.addBlogPost(newPost);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if writeToFile throws an error', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileBlogService(await open(''), 'path');

      const writeToFileSpy = jest.spyOn(svc, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.addBlogPost(newPost)).rejects.toThrow(testError);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteBlogPost', () => {
    test('deletes post from posts, returns post', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileBlogService(await open(''), 'path', [
        post1,
        post2,
        post3,
        post4,
      ]);
      expect(svc.blogPostsByDate.length).toBe(4);

      const result = await svc.deleteBlogPost(post1.slug);
      expect(svc.blogPostsByDate.length).toBe(3);
      expect(result.toJSON()).toStrictEqual(post1.toJSON());
    });

    test('throws an error if the slug does not exist', async () => {
      const svc = new FileBlogService(await open(''), 'path', [
        post1,
        post2,
        post3,
        post4,
      ]);
      expect(svc.blogPostsByDate.length).toBe(4);

      await expect(() => svc.deleteBlogPost('not a slug')).rejects.toThrow();
      expect(svc.blogPostsByDate.length).toBe(4);
    });

    test('Runs writeToFile', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileBlogService(await open(''), 'path', [post1]);

      const writeToFileSpy = jest.spyOn(svc, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await svc.deleteBlogPost(post1.slug);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if writeToFile throws an error', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const svc = new FileBlogService(await open(''), 'path', [post1]);

      const writeToFileSpy = jest.spyOn(svc, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.deleteBlogPost(post1.slug)).rejects.toThrow(
        testError,
      );

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('blogString', () => {
    test('Returns a JSON string with an empty array with no posts', async () => {
      const svc = new FileBlogService(await open(''), 'path');
      expect(svc.blogString).toBe('[]');
    });

    test('Returns a JSON string with expected values', async () => {
      const svc = new FileBlogService(await open(''), 'path', [post1]);
      expect(svc.blogString).toBe(`[${JSON.stringify(post1.toJSON())}]`);
    });
  });

  describe('writeToFile', () => {
    test('gets the string, runs truncate and writes to the file handle', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FileBlogService(await open(''), 'path', [post1]);

      const str = svc.blogString;

      await svc.writeToFile();

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.write).toHaveBeenCalledWith(str, 0);
    });

    test('Throws an error if truncate throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new FileBlogService(await open(''), 'path', [post1]);

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(0);
    });

    test('Throws an error if write throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new FileBlogService(await open(''), 'path', [post1]);

      const str = svc.blogString;

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.write).toHaveBeenCalledWith(str, 0);
    });
  });

  describe('backup', () => {
    test('runs writeBackup with expected values', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileBlogService(await open(''), 'path', [post1]);
      await svc.backup();

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('blog_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.blogString, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);

      const svc = new FileBlogService(await open(''), 'path', [post1]);

      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('blog_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if truncate throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileBlogService(await open(''), 'path', [post1]);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('blog_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if write throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileBlogService(await open(''), 'path', [post1]);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('blog_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.blogString, 0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if close throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileBlogService(await open(''), 'path', [post1]);

      closeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('blog_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.blogString, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('makeFileHandle', () => {
    const path = 'path/to/file';
    const name = 'name.ext';

    test('calls mkdir and open', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const result = await FileBlogService.makeFileHandle(path, name);

      expect(result).toBe(mockFileHandle);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, name), 'a+');
    });

    test('uses the default file name if not provided', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const result = await FileBlogService.makeFileHandle(path);

      expect(result).toBe(mockFileHandle);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, FILE_NAME), 'a+');
    });

    test('throws an error if mkdir throws an error', async () => {
      mockMkdir.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() =>
        FileBlogService.makeFileHandle(path, name),
      ).rejects.toThrow(testError);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(0);
    });

    test('throws an error if open throws an error', async () => {
      mockOpen.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() =>
        FileBlogService.makeFileHandle(path, name),
      ).rejects.toThrow(testError);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, name), 'a+');
    });
  });

  describe('writeBackup', () => {
    const stringData = 'string data';
    const backupPath = 'backupPath';
    const filename = 'name';

    test('runs functions with expected values', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      await FileBlogService.writeBackup(backupPath, stringData, 'name');

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(stringData, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileBlogService.writeBackup(backupPath, stringData, 'name'),
      ).rejects.toThrow();

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if truncate throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileBlogService.writeBackup(backupPath, stringData, 'name'),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if write throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileBlogService.writeBackup(backupPath, stringData, 'name'),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(stringData, 0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if close throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      closeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileBlogService.writeBackup(backupPath, stringData, 'name'),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(stringData, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('init', () => {
    const blogPath = 'blog path';

    test('creates a file handle, reads a file, creates blog posts and returns a new FileBlogService', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from(
        JSON.stringify([post1, post2, post3, post4]),
        'utf-8',
      );

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FileBlogService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).blogPostsByDate.length).toBe(4);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('Only includes posts that are valid', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from(
        JSON.stringify([post1, post2, post3, {}]),
        'utf-8',
      );

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FileBlogService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).blogPostsByDate.length).toBe(3);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('If the raw data buffer is a zero length string, truncate and write are called', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FileBlogService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).blogPostsByDate.length).toBe(0);
    });

    test('If the raw data buffer is a non-zero length non-JSON string, truncate and write are called and a backup is made', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {});

      const svc = await FileBlogService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);

      expect((await svc).blogPostsByDate.length).toBe(0);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith('[]', 0);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => FileBlogService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect(readFileMock).toHaveBeenCalledTimes(0);
      expect(writeBackupSpy).toHaveBeenCalledTimes(0);
      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if readFile throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      readFileMock.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() => FileBlogService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);

      expect(writeBackupSpy).toHaveBeenCalledTimes(0);
      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if writeBackup throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => FileBlogService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if truncate throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {});

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => FileBlogService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledTimes(1);

      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if write throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {});

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => FileBlogService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledTimes(1);
    });
  });
});
