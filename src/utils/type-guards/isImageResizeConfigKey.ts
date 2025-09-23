import { ImageResizeConfig, ImageResizeOptions } from '../../config/main';
/**
 * Key is ImageResizeOptions property.
 * @param key Options key.
 * @returns Boolean.
 */
export const isImageResizeConfigKey = (
  key: string
): key is keyof ImageResizeOptions => {
  return Object.keys(ImageResizeConfig).includes(key);
};
