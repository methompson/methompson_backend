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

const extensionMimetypeMap: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  tiff: 'image/tiff',
  bmp: 'image/bmp',
  heic: 'image/heic',
};

export function isImageMimeType(mimetype: string): boolean {
  return Object.values(extensionMimetypeMap).includes(mimetype);
}

export function extensionMatchesMimetype(
  extension: string,
  mimetype: string,
): boolean {
  return extensionMimetypeMap[extension] === mimetype;
}
