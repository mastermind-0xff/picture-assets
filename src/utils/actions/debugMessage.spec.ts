import { debugMessage } from './debugMessage';

describe('debugMessage', () => {
  beforeEach(() => {
    console.log = jest.fn();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('error is displayed', () => {
    debugMessage('Some error text message.', 'error', true);
    expect(console.log).toHaveBeenLastCalledWith(expect.stringContaining('🛑'));
  });
  test('warning is displayed', () => {
    debugMessage('Some error text message.', 'warning', true);
    expect(console.log).toHaveBeenLastCalledWith(expect.stringContaining('⚠️'));
  });
  test('success is displayed', () => {
    debugMessage('Some error text message.', 'success', true);
    expect(console.log).toHaveBeenLastCalledWith(expect.stringContaining('✅'));
  });
  test('notification is displayed', () => {
    debugMessage('Some error text message.', 'notification', true);
    expect(console.log).toHaveBeenLastCalledWith(expect.stringContaining('🟦'));
  });
  test('nothing is displayed', () => {
    debugMessage('Some error text message.', 'error', false);
    expect(console.log).not.toHaveBeenCalled();
  });
});
