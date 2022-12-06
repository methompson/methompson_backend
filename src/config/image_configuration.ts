import * as path from 'path';

export function imageConfiguration() {
  let imageServerType = 'memory';
  if (process.env.BLOG_SERVER_TYPE === 'mongo_db') {
    imageServerType = 'mongo_db';
  }

  return {
    imageServerType,
    temp_image_path: process.env.TEMP_IMAGE_PATH ?? '',
    saved_image_path:
      process.env.SAVED_IMAGE_PATH ?? path.join(__dirname, 'images'),
  };
}
