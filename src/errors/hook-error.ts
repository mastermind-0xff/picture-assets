import type { HookPoint } from '../types/hooks.js';

/**
 * A hook threw, or returned something that is not an image. Fails the
 * hook's size, its file at `beforeFormat`, or its source at
 * `afterSourceLoad`. The hook's error is the `cause`.
 */
export class HookError extends Error {
  override name = 'HookError';
  /** The hook's name. */
  readonly hook: string;
  readonly point: HookPoint;

  constructor(
    message: string,
    hook: string,
    point: HookPoint,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.hook = hook;
    this.point = point;
  }
}
