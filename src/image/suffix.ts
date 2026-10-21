/** Values for the suffix wildcards. Missing values are replaced by blanks. */
export interface SuffixData {
  width?: number;
  height?: number;
  sizeMultiplier?: number;
  widthMultiplier?: number;
  heightMultiplier?: number;
}

/**
 * The suffix wildcards and the values replacing them:
 * - `{w}`, `{h}`: width and height of the file, in pixels;
 * - `{x}`: the multiplier of the size, the `2` of `2x`: every size has one,
 *   pixel sizes too (see `resizeStrategyHint`);
 * - `{wx}`, `{hx}`: the multipliers of the width and of the height, which
 *   differ only for sizes with another aspect ratio than the source; `{x}`
 *   is then their average.
 */
export const SUFFIX_WILDCARDS = {
  '{w}': 'width',
  '{h}': 'height',
  '{x}': 'sizeMultiplier',
  '{wx}': 'widthMultiplier',
  '{hx}': 'heightMultiplier',
} as const satisfies Record<string, keyof SuffixData>;

type SuffixWildcard = keyof typeof SUFFIX_WILDCARDS;

const WILDCARD = /{\w+}/g;

const isSuffixWildcard = (value: string): value is SuffixWildcard =>
  Object.hasOwn(SUFFIX_WILDCARDS, value);

/** The first `{name}` of the suffix that isn't a wildcard, if any. */
export const findUnknownWildcard = (suffix: string): string | undefined =>
  suffix.match(WILDCARD)?.find((match) => !isSuffixWildcard(match));

/**
 * Path separators, characters Windows doesn't allow in file names and
 * control characters: removed from suffixes, so a suffix can never write
 * outside the destination or fail on one platform only.
 */
// eslint-disable-next-line no-control-regex
const UNSAFE_FILE_NAME_CHARACTERS = /[<>:"/\\|?*\x00-\x1F]+/g;

/**
 * Replaces the wildcards in the suffix (see `SUFFIX_WILDCARDS`) with values
 * from `dimensionsData`; missing values are replaced with blanks, unknown
 * wildcards are kept (the options reject them). Path separators and
 * characters not allowed in file names are removed from the result.
 * Trimmed.
 *
 * **example:**
 * ```typescript
 * //returns '@2x_2048w'
 * parseSuffix('@{x}x_{w}w', { sizeMultiplier: 2, width: 2048 });
 * ```
 * ---
 * @param suffix String to be attached to every output filename, with the
 * wildcards `{w}`, `{h}`, `{x}`, `{wx}` and `{hx}`.
 * @param dimensionsData Object providing replacement data for the wildcards.
 * @returns The new resolved string suffix.
 */
export const parseSuffix = (
  suffix: string,
  dimensionsData: SuffixData = {}
): string =>
  suffix
    .replace(WILDCARD, (match) =>
      isSuffixWildcard(match) ?
        `${dimensionsData[SUFFIX_WILDCARDS[match]] ?? ''}`
      : match
    )
    .replace(UNSAFE_FILE_NAME_CHARACTERS, '')
    .trim();
