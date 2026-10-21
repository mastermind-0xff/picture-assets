import { ExecutionScopes } from '../global-enums/main';
import { ExecutionScope } from '../types/execution';
import { logMessage } from '../log/logger';
import { LOG_LEVEL } from './logging';

const DEFAULT_ABORT_SCOPE: ExecutionScope = 'format';

export const abortScope: ExecutionScope = (() => {
  const envValue = process?.env?.IMAGE_RESIZE_ABORT_SCOPE;
  if (envValue == null) return DEFAULT_ABORT_SCOPE;
  if (Object.hasOwnProperty.call(ExecutionScopes, envValue))
    return envValue as ExecutionScope;

  logMessage(
    'warning',
    'Using defaults.',
    'Unknown config for IMAGE_RESIZE_ABORT_SCOPE',
    LOG_LEVEL
  );

  return DEFAULT_ABORT_SCOPE;
})();
