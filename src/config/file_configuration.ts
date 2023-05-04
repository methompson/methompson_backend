import * as path from 'path';
import { isNullOrUndefined } from '@/src/utils/type_guards';

export function fileConfiguration() {
  const { FILES_SERVER_TYPE, FILES_FILE_PATH } = process.env;

  const options: Record<string, unknown> = {
    fileServerType: 'memory',
    tempFilePath: process.env.TEMP_FILE_PATH ?? '',
    savedFilePath: process.env.SAVED_FILE_PATH ?? path.join(__dirname, 'file'),
  };

  if (FILES_SERVER_TYPE === 'mongo_db') {
    options.fileServerType = 'mongo_db';
  } else if (
    FILES_SERVER_TYPE === 'file' &&
    !isNullOrUndefined(FILES_FILE_PATH)
  ) {
    options.fileServerType = 'file';
    options.fileServerDataPath = FILES_FILE_PATH;
  }

  return options;
}
