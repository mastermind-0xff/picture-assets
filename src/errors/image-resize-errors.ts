import {
  ResultBatch,
  ResultFormat,
  ResultSetting,
  ResultSource,
} from '../types/output';

export class DimensionMissingError extends Error {
  override name = 'DimensionMissingError';
}
export class MetadataMissingError extends Error {
  override name = 'MetadataMissingError';
}

export class ErrorBase extends Error {
  public cause: any;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, this.constructor);
    if (options && 'cause' in options) (this as any).cause = options.cause;
  }
}

export class ResultFormatsError extends ErrorBase {
  constructor(
    message: string,
    public resultFormats: ResultFormat[],
    options?: { cause?: unknown }
  ) {
    super(message, options);
  }
}

export class ResultSettingsError extends ErrorBase {
  constructor(
    message: string,
    public resultSettings: ResultSetting[],
    options?: { cause?: unknown }
  ) {
    super(message, options);
  }
}

export class ResultSourceError extends ErrorBase {
  constructor(
    message: string,
    public resultSource: ResultSource,
    options?: { cause?: unknown }
  ) {
    super(message, options);
  }
}

export class ResultBatchError extends ErrorBase {
  constructor(
    message: string,
    public resultBatch: ResultBatch,
    options?: { cause?: unknown }
  ) {
    super(message, options);
  }
}
