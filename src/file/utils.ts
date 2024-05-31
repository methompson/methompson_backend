export interface FilenameComponents {
  name: string;
  extension: string;
}

export function getFilenameComponents(filename: string): FilenameComponents {
  const split = filename.split('.');
  if (split.length === 1) {
    return {
      name: filename,
      extension: '',
    };
  }

  const splitPoint = split.length - 1;

  return {
    name: split.slice(0, splitPoint).join('.'),
    extension: split[splitPoint] ?? '',
  };
}
