import { isString } from '@/src/utils/type_guards';

export function logConfiguration() {
  const defaultLoggingConfig = {
    loggingType: 'console',
  };

  if (process.env.LOGGING_TYPE === 'console') {
    return defaultLoggingConfig;
  }

  const port = process.env.MONGO_DB_PORT ?? '27017';
  const username = process.env.MONGO_DB_USERNAME;
  const password = process.env.MONGO_DB_PASSWORD;
  const url = process.env.MONGO_DB_HOST;

  if (
    isString(port) &&
    isString(username) &&
    isString(password) &&
    isString(url)
  ) {
    return {
      loggingType: 'mongo_db',
      port,
      username,
      password,
      url,
    };
  }

  return defaultLoggingConfig;
}
