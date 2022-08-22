export function imageConfiguration() {
  return {
    temp_image_path: process.env.TEMP_IMAGE_PATH ?? '',
    saved_image_path: process.env.SAVED_IMAGE_PATH ?? 'images',
  };
}
