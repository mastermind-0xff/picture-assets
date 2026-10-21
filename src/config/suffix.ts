export const suffix =
  typeof process?.env?.IMAGE_RESIZE_SUFFIX !== 'undefined' ?
    process.env.IMAGE_RESIZE_SUFFIX.replace(/[/\\]+/g, '')
  : '@{w}w';
