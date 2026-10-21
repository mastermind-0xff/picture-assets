import sharp, { FormatEnum } from 'sharp';

// map all filetype aliases to their runtime object counterpart
const FormatEnum2SharpFormatMap = (() => {
  const result: { [key: string]: string } = {};
  for (const format of Object.keys(sharp.format)) {
    //@ts-ignore
    const formatIO = sharp.format[format];
    if (formatIO.input?.fileSuffix?.length)
      for (let formatExt of formatIO.input.fileSuffix)
        (formatExt = String(formatExt).substring(1)) !== format &&
          (result[formatExt] = format);

    if (formatIO.output?.alias?.length)
      for (let formatExt of formatIO.output.alias)
        (formatExt = String(formatExt).substring(1)) !== format &&
          (result[formatExt] = format);
  }
  return result;
})();

/**
 * Sharp Format type guard. Checks if a given format is supported by sharp.
 * @param key File name extension string.
 * @returns Boolean.
 */
export const isSharpFormatEnum = (key: string): key is keyof FormatEnum => {
  // if (FormatEnum2SharpFormatMap[key]) key = FormatEnum2SharpFormatMap[key]!;
  // return typeof sharp.format[key as keyof FormatEnum] !== 'undefined';
  const format = FormatEnum2SharpFormatMap[key] ?? key;
  return format in sharp.format;
};
