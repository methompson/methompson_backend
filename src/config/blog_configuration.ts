import { isString } from '@/src/utils/type_guards';

export function blogConfiguration() {
  console.log('blogConfiguration');
  const defaultBlogConfig = {
    blogType: 'memory',
  };

  if (process.env.BLOG_TYPE === 'memory') {
    return defaultBlogConfig;
  }

  const username = process.env.MONGO_DB_USERNAME;
  const password = process.env.MONGO_DB_PASSWORD;
  const url = process.env.MONGO_DB_HOST;
  const mongoUseSrv = process.env.MONGO_USE_SRV === 'true';

  if (isString(username) && isString(password) && isString(url)) {
    return {
      blogType: 'mongo_db',
      username,
      password,
      url,
      mongoUseSrv,
    };
  }

  return defaultBlogConfig;
}
