import fs from 'fs';
import path from 'path';

import { sec } from 'style-escape-codes';

/**
 * Checks if all files in a output directory exist. Missing files are marked
 * with console message.
 * @param basePath Directory where files should reside.
 * @param filesList List of file names to attach to `basePath`.
 * @returns True if all files in the list exist, false if some are missing.
 */
export const allFilesExist = (basePath: string, filesList: string[]) => {
  for (const fileName of filesList) {
    const filePath = path.join(basePath, fileName);
    const fileExists = fs.existsSync(filePath);
    if (!fileExists) {
      console.log(
        `${sec.b.bgRed(' File does not exist ')}${basePath}${sec.red(fileName)}`
      );
      return false;
    }
  }
  return true;
};
