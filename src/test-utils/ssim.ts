import sharp from 'sharp';

/** Luma of 8 bit pixels with 1 to 4 channels. */
const luma = (data: Buffer, channels: number, pixels: number) => {
  const values = new Float64Array(pixels);
  for (let index = 0; index < pixels; index++) {
    const offset = index * channels;
    values[index] =
      channels >= 3 ?
        0.299 * data[offset]! +
        0.587 * data[offset + 1]! +
        0.114 * data[offset + 2]!
      : data[offset]!;
  }
  return values;
};

/**
 * Mean SSIM of two images' luma over 8x8 windows, every 4 pixels: 1 is
 * identical. The same as bench/shared.js.
 */
export const ssim = async (a: string | Buffer, b: string | Buffer) => {
  const read = (input: string | Buffer) =>
    sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const [first, second] = await Promise.all([read(a), read(b)]);
  const { width, height, channels } = first.info;
  if (second.info.width !== width || second.info.height !== height)
    throw new Error(
      `Sizes differ: ${width}x${height} and ${second.info.width}x${second.info.height}.`
    );
  const x = luma(first.data, channels, width * height);
  const y = luma(second.data, second.info.channels, width * height);
  const C1 = (0.01 * 255) ** 2;
  const C2 = (0.03 * 255) ** 2;
  const WINDOW = 8;
  const n = WINDOW * WINDOW;
  let total = 0;
  let windows = 0;
  for (let top = 0; top + WINDOW <= height; top += 4)
    for (let left = 0; left + WINDOW <= width; left += 4) {
      let sumX = 0;
      let sumY = 0;
      let sumXX = 0;
      let sumYY = 0;
      let sumXY = 0;
      for (let row = top; row < top + WINDOW; row++)
        for (let column = left; column < left + WINDOW; column++) {
          const p = x[row * width + column]!;
          const q = y[row * width + column]!;
          sumX += p;
          sumY += q;
          sumXX += p * p;
          sumYY += q * q;
          sumXY += p * q;
        }
      const meanX = sumX / n;
      const meanY = sumY / n;
      const covariance = sumXY / n - meanX * meanY;
      total +=
        ((2 * meanX * meanY + C1) * (2 * covariance + C2)) /
        ((meanX ** 2 + meanY ** 2 + C1) *
          (sumXX / n - meanX ** 2 + sumYY / n - meanY ** 2 + C2));
      windows++;
    }
  return total / windows;
};
