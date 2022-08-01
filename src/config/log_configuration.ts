import { isString } from '@/src/utils/type_guards';

export function logConfiguration() {
  let loggingConfig: Record<string, unknown> = {};

  loggingConfig.console_logging = process.env.CONSOLE_LOGGING === 'true';

  const username = process.env.MONGO_DB_USERNAME;
  const password = process.env.MONGO_DB_PASSWORD;
  const url = process.env.MONGO_DB_HOST;
  const mongoUseSrv = process.env.MONGO_USE_SRV === 'true';

  if (isString(username) && isString(password) && isString(url)) {
    loggingConfig = {
      ...loggingConfig,
      db_logging: true,
      username,
      password,
      url,
      mongoUseSrv,
    };
  } else {
    loggingConfig.db_logging = false;
  }

  return loggingConfig;
}
