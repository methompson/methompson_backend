import { isRecord, isString } from '@src/utils/type_guards';

interface MongoDBOptions {
  username: string;
  password: string;
  url: string;
  port: string;
}

function isMongoDBOptions(value: unknown): value is MongoDBOptions {
  if (!isRecord(value)
    || !isString(value.username)
    || !isString(value.password)
    || !isString(value.url)
    || !isString(value.port)
  ) {
    return false;
  }

  return true;
}

export {
  MongoDBOptions,
  isMongoDBOptions,
};