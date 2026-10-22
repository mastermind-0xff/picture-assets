import type { ResultBatch, ResultSource } from '../types/output.js';

/**
 * Thrown by `generateSingleSourceAssets` with `abortScope: 'batch'` when the
 * source fails. Carries the result up to the failure.
 */
export class ResultSourceError extends Error {
  override name = 'ResultSourceError';
  readonly resultSource: ResultSource;

  constructor(
    message: string,
    resultSource: ResultSource,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.resultSource = resultSource;
  }
}

/**
 * Thrown by `generateBatchAssets` with `abortScope: 'batch'` when a source
 * fails. Carries the result of every source: the failed one, those stopped
 * (`'aborted'`) and those finished before.
 */
export class ResultBatchError extends Error {
  override name = 'ResultBatchError';
  readonly resultBatch: ResultBatch;

  constructor(
    message: string,
    resultBatch: ResultBatch,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.resultBatch = resultBatch;
  }
}
