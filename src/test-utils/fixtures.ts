import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';

/** Raw RGB gradient with a checker pattern: detail for the encoders. */
const gradient = (width: number, height: number): Buffer => {
  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3;
      const checker = (Math.floor(x / 16) + Math.floor(y / 16)) % 2 ? 40 : 0;
      data[offset] = Math.round((x / width) * 215) + checker;
      data[offset + 1] = Math.round((y / height) * 215) + checker;
      data[offset + 2] = 128;
    }
  return data;
};

/**
 * Fine detail: thin diagonal lines, where a fraction of a pixel of shift
 * shows in SSIM.
 */
export const detailedImage = (width: number, height: number) => {
  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      data.fill(
        (x + y) % 6 < 2 ? 30 : 225,
        (y * width + x) * 3,
        (y * width + x + 1) * 3
      );
  return sharp(data, { raw: { width, height, channels: 3 } });
};

/** An opaque image of the given size. */
export const opaqueImage = (width: number, height: number) =>
  sharp(gradient(width, height), { raw: { width, height, channels: 3 } });

/**
 * A transparent image: an opaque red disc on a transparent background whose
 * hidden color is black, the way most editors store it.
 */
export const transparentImage = (size: number) => {
  const data = Buffer.alloc(size * size * 4);
  const radius = size / 4;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const inside = (x - size / 2) ** 2 + (y - size / 2) ** 2 < radius ** 2;
      data.set(inside ? [220, 30, 30, 255] : [0, 0, 0, 0], (y * size + x) * 4);
    }
  return sharp(data, { raw: { width: size, height: size, channels: 4 } });
};

/** Creates a temporary directory, removed by the returned function. */
export const createTempDir = async (prefix = 'picture-assets-') => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  return {
    dir,
    remove: () => fs.rm(dir, { recursive: true, force: true }),
  };
};

/**
 * Writes the fixture images into a directory:
 *
 * - `landscape.jpg`: 800x600.
 * - `portrait-exif.jpg`: stored 800x600 with EXIF orientation 6, shown
 *   600x800, like phone photos.
 * - `transparent.png`: 400x400, transparent background.
 * - `small.webp`: 200x100.
 * - `display-p3.png`: 64x64 of sRGB (200, 100, 50), stored as Display P3
 *   values with the P3 profile, and EXIF.
 * - `corrupt.jpg`: not an image.
 * - `notes.txt`: not an image either, ignored by batches.
 * - `tree/a.jpg`, `tree/sub/b.png`, `tree/sub/deeper/c.webp`: 400x300
 *   each, for batches.
 */
export const writeFixtures = async (dir: string) => {
  const file = (name: string) => path.join(dir, name);
  await fs.mkdir(file('tree/sub/deeper'), { recursive: true });
  await Promise.all([
    opaqueImage(800, 600).jpeg().toFile(file('landscape.jpg')),
    opaqueImage(800, 600)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toFile(file('portrait-exif.jpg')),
    transparentImage(400).png().toFile(file('transparent.png')),
    opaqueImage(200, 100).webp().toFile(file('small.webp')),
    sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .withIccProfile('p3')
      .withExif({ IFD0: { Copyright: 'fixture' } })
      .png()
      .toFile(file('display-p3.png')),
    fs.writeFile(file('corrupt.jpg'), 'not an image'),
    fs.writeFile(file('notes.txt'), 'not an image either'),
    opaqueImage(400, 300).jpeg().toFile(file('tree/a.jpg')),
    opaqueImage(400, 300).png().toFile(file('tree/sub/b.png')),
    opaqueImage(400, 300).webp().toFile(file('tree/sub/deeper/c.webp')),
  ]);
  return file;
};

/** Lists the files of a directory tree, relative, with `/` separators. */
export const listFiles = async (dir: string): Promise<string[]> => {
  const files: string[] = [];
  for await (const entry of fs.glob('**/*', { cwd: dir, withFileTypes: true }))
    if (entry.isFile())
      files.push(
        path
          .relative(dir, path.join(entry.parentPath, entry.name))
          .replaceAll('\\', '/')
      );
  return files.sort();
};
