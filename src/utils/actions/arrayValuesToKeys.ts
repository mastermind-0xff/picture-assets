/**
 * Convert array of strings to object with keys set to predefined value or
 * values.
 *
 * **_examples:_**
 * ```typescript
 * arrayValuesToKeys(['a','b'],''); // {'a':'', 'b':''}
 * arrayValuesToKeys(['a','b','d','e'],[1,2]); // {'a':1, 'b':2, 'c':1, 'b':2}
 * ```
 *
 * @param list Array of strings.
 * @param fillValue Array of values for every key or single value to fill all
 * keys.
 * @returns Object.
 */
export const arrayValuesToKeys = <T extends PropertyKey, VT>(
  list: T[],
  fillValue: VT | VT[]
): { [K in T]: VT } => {
  return list.reduce(
    (acc, value, n) => (
      (acc[value] = Array.isArray(fillValue)
        ? fillValue[n % fillValue.length]!
        : fillValue),
      acc
    ),
    {} as { [K in T]: VT }
  );
};
