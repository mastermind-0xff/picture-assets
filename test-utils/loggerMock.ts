import { extractCallerFromStack } from './stackHelpers';

/**
 * Replaces the original `logMessage` with the mocked `logMessageMock` in a
 * mocked logger module. Module reset might be required to use the mocked
 * version of the module.
 *
 * @returns Mocked function and tagged mocked function.
 */
export const mockLogMessage = () => {
  const { logMessageMock, logMessageTaggedMock } = createLogMessageMock();

  jest.doMock('../src/log/logger', () => ({
    ...jest.requireActual('../src/log/logger'),
    logMessage: logMessageMock,
  }));

  return { logMessageMock, logMessageTaggedMock };
};

/**
 * Creates a normal mock that takes the execution stack and extracts the caller
 * frame as a tag `'(frameName)'`. Then it redirects the call to the tagged mock
 * function with title prefixed with the tag. Tag can be filtered later on by
 * using `filterLogMessageCallsByTag`.
 *
 * @returns Mocked function and tagged mocked function.
 */
export const createLogMessageMock = () => {
  // final mock function that will be tagged and tracked
  const logMessageTaggedMock = jest.fn();

  // tag every logMessage with its caller as title prefix
  const logMessageMock = jest.fn((...args: any[]) => {
    const argsWithTitleCaller = [...args];
    argsWithTitleCaller[2] = `(${extractCallerFromStack('mockConstructor')})${argsWithTitleCaller[2]}`;
    logMessageTaggedMock(...argsWithTitleCaller);
  });

  return { logMessageMock, logMessageTaggedMock };
};

/**
 * Creates new mock function from the tagged mock that has the correct Nth call
 * order for a given stack frame and tag stripped from the title.
 *
 * @param logMessageMock Tagged logMessage final mock.
 * @param tag Tag string to filter the title by.
 * @returns New filtered mock.
 */
export const filterLogMessageCallsByTag = (
  logMessageMock: jest.Mock,
  tag: string
): jest.Mock => {
  const filteredMock = jest.fn();

  const orgMockData = logMessageMock.mock;
  const filterMockData = filteredMock.mock;

  // try not to mutate the original tagged mock function
  // important: logMessage 2nd argument can be an object or array, that can
  // still be mutated.
  for (let i = 0; i < orgMockData.calls.length; i++) {
    if (orgMockData.calls[i][2].startsWith(tag)) {
      filterMockData.calls.push([...orgMockData.calls[i]]);
      filterMockData.calls.at(-1)[2] = filterMockData.calls
        .at(-1)[2]
        .replace(tag, '');
      filterMockData.contexts.push(orgMockData.contexts[i]);
      filterMockData.instances.push(orgMockData.instances[i]);
      filterMockData.invocationCallOrder.push(
        orgMockData.invocationCallOrder[i]!
      );
      filterMockData.results.push({
        ...orgMockData.results[i],
      } as (typeof filterMockData.results)[0]);
    }
  }

  filterMockData.lastCall =
    filterMockData.calls.length > 0 ? filterMockData.calls.at(-1) : undefined;

  return filteredMock;
};
