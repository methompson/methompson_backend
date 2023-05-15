import { isNullOrUndefined } from '@/src/utils/type_guards';

export function noteConfiguration() {
  const { NOTES_SERVER_TYPE, NOTES_FILE_PATH } = process.env;

  if (NOTES_SERVER_TYPE === 'file' && !isNullOrUndefined(NOTES_FILE_PATH)) {
    return {
      notesType: 'file',
      notesFilePath: NOTES_FILE_PATH,
    };
  }

  return {
    notesType: 'memory',
  };
}
