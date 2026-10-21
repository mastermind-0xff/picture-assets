/**
 * Extracts the caller function name from the stack trace.
 * Used only in tests to tag mocked logMessage calls with their origin.
 *
 * @param sliceStackAt - A substring that identifies the wrapper function in the
 * stack; the caller is taken as the next frame.
 */
export const extractCallerFromStack = (
  sliceStackAt: string
): string | undefined => {
  const stack = Error().stack?.split('\n') ?? [];
  const wrapperIndex =
    sliceStackAt ? stack.findIndex((v) => v.includes(sliceStackAt)) : 1;
  let depth = wrapperIndex >= 0 ? wrapperIndex + 1 : 2;
  return ((stack[depth] ?? '').match(/at\s([^\(]+)\s+/) ?? [])[1];
};
