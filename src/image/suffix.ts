/** Values for the suffix wildcards. Missing values are replaced by blanks. */
export interface SuffixData {
  width?: number;
  height?: number;
  sizeMultiplier?: number;
  widthMultiplier?: number;
  heightMultiplier?: number;
}

/**
 * Path separators, characters Windows doesn't allow in file names and
 * control characters: removed from suffixes, so a suffix can never write
 * outside the destination or fail on one platform only.
 */
// eslint-disable-next-line no-control-regex
const UNSAFE_FILE_NAME_CHARACTERS = /[<>:"/\\|?*\x00-\x1F]+/g;

/**
 * Replaces supported wildcards in the suffix with values from
 * `dimensionsData`; missing values are replaced with blanks, unknown
 * wildcards are kept. Path separators and characters not allowed in file
 * names are removed from the result. Trimmed.
 *
 * **example:**
 * ```typescript
 * //returns '_@x2_2048w'
 * parseSuffix('_@x{sm}_{w}w', { sizeMultiplier: 2, width: 2048 });
 * ```
 * ---
 * @param suffix String to be attached to every output filename.
 * - *wildcards:*\
 * `'{w}'` - width in pixels;\
 * `'{h}'` - height in pixels;\
 * `'{sm}'` - size multiplier, the average of the width and height
 * multipliers;\
 * `'{wm}'` - width multiplier;\
 * `'{hm}'` - height multiplier.
 * - *example:*\
 * `_@x{sm}_{w}w` - can produce `'_@x2_2048w'`.
 *
 * @param dimensionsData Object providing replacement data for the wildcards.
 * @returns The new resolved string suffix.
 */
export const parseSuffix = (
  suffix: string,
  dimensionsData: SuffixData = {}
): string => {
  const { width, height, sizeMultiplier, widthMultiplier, heightMultiplier } =
    dimensionsData;
  const wildcards: Record<string, number | undefined> = {
    '{w}': width,
    '{h}': height,
    '{sm}': sizeMultiplier,
    '{wm}': widthMultiplier,
    '{hm}': heightMultiplier,
  };
  return suffix
    .replace(/{\w+}/g, (match) =>
      Object.hasOwn(wildcards, match) ? `${wildcards[match] ?? ''}` : match
    )
    .replace(UNSAFE_FILE_NAME_CHARACTERS, '')
    .trim();
};
