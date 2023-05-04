import { isNullOrUndefined } from '@/src/utils/type_guards';

export function blogConfiguration() {
  const { BLOG_SERVER_TYPE, BLOG_FILE_PATH } = process.env;

  if (BLOG_SERVER_TYPE === 'mongo_db') {
    return {
      blogType: 'mongo_db',
    };
  } else if (
    BLOG_SERVER_TYPE === 'file' &&
    !isNullOrUndefined(BLOG_FILE_PATH)
  ) {
    return {
      blogType: 'file',
      blogFilePath: BLOG_FILE_PATH,
    };
  }

  return {
    blogType: 'memory',
  };
}
