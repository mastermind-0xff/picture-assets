import { CallableProperty, sec } from 'style-escape-codes';

import { LogMessageType as LogType, LogLevel } from '../types/log';
import { LogLevels } from '../global-enums/main';
import { formatMsTime } from '../utils/helpers';

const LogStyles = {
  fatal: {
    symbol: '🛑  ',
    brushFg: sec.b.fg.hex('f00'),
    brushBg: sec.bg.hsl(0, 50, 20),
  },
  error: {
    symbol: '❗  ',
    brushFg: sec.b.fg.hex('f00'),
    brushBg: sec.bg.hsl(0, 50, 20),
  },
  warning: {
    symbol: '⚠️   ',
    brushFg: sec.b.fg.hex('ff0'),
    brushBg: sec.bg.hsl(60, 50, 20),
  },
  info: {
    symbol: 'ℹ️   ',
    brushFg: sec.b.fg.hex('0ff'),
    brushBg: sec.bg.hsl(180, 50, 20),
  },
  debug: {
    symbol: '🪰   ',
    brushFg: sec.b.fg.hex('0f0'),
    brushBg: sec.bg.hsl(120, 50, 20),
  },
  trace: {
    symbol: '🔝  ',
    brushFg: sec.b.fg.hex('f0f'),
    brushBg: sec.bg.hsl(300, 100, 20),
  },
  verbose: { symbol: '    ', brushFg: sec.b, brushBg: sec.b },
} as const satisfies Record<
  LogType,
  { symbol: string; brushFg: CallableProperty; brushBg: CallableProperty }
>;

/**
 * The content to be outputted by the logger as the main body of the message.
 *
 * Simple string, object with text properties or an array of entries allowed.
 * In case of object, each property/item is printed on a new line.
 */
export type LogMessageContent = string | Record<string, unknown> | unknown[];

/**
 * Additional title of the log message.
 *
 * Simple string or undefined to omit the title completely.
 */
export type LogTitleText = string | undefined;

/**
 * Display a styled log message to the output stream based on its type.
 * A custom title may be provided; otherwise no title is shown.
 *
 * @param message Message to display. If an array is provided, each item is
 * printed on a new line.
 * @param type Log level of this message.
 * @param title Optional title shown before the message.
 * @param configLogLevel Current logging level. Messages below this level are
 * suppressed.
 */
export const logMessage = (
  type: LogType,
  message: LogMessageContent,
  title: LogTitleText,
  configLogLevel: LogLevel
): void => {
  if (LogLevels[type] > LogLevels[configLogLevel]) return;
  const { symbol, brushFg, brushBg } = LogStyles[type];

  const timestamp = new Intl.DateTimeFormat(undefined, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
  const styledTimestamp = sec.fgBrightBlack(timestamp);

  const typePadLength = 7;
  let paddedType = type
    .padStart(type.length + Math.floor((typePadLength - type.length) / 2), ' ')
    .padEnd(typePadLength, ' ');
  let styledType = `${brushFg.u.o(brushBg(`│ ${paddedType}│`))} `;
  let styledTitle = title ? brushFg(`${title}: `) : '';

  let text: string;
  if (typeof message === 'object') {
    text = '';
    Object.entries(message).forEach(([key, value]) => {
      text += `\n${key}: ${JSON.stringify(value)}`;
    });
    if (
      LogLevels[type] >= LogLevels['fatal'] &&
      LogLevels[type] < LogLevels['info'] &&
      message instanceof Error &&
      'cause' in message &&
      message.cause instanceof Error
    )
      text += `\ncause.stack: ${message.cause.stack}`;
  } else text = message;

  console.log(`${styledTimestamp} ${symbol}${styledType}${styledTitle}${text}`);
  type === 'trace' && console.trace();
};

export type PlotSettings = {
  size: { cols: number; rows: number };
  maxValue?: number;
  title?: string;
  valueSymbol?: string;
  totalTime?: number;
};

/**
 * Plot a graph of values. Size, maximum value, title and the maximum value's
 * symbol are configurable.
 *
 * @param type Log level of this plot.
 * @param configLogLevel Current logging level. Messages below this level are
 * suppressed.
 * @param values Numeric values to be plotted.
 * @param settings Optional settings. Includes the size of the plot in columns
 * and rows. All other value are optional: maximum value (otherwise it's
 * inferred from the values), title, values symbol and total time in
 * milliseconds.
 */
export const plotValues = (
  type: LogType,
  configLogLevel: LogLevel,
  values: number[],
  settings: PlotSettings = {
    size: { cols: 30, rows: 4 },
  }
) => {
  if (LogLevels[type] > LogLevels[configLogLevel]) return;

  const {
    size: { cols, rows },
    maxValue,
    title,
    valueSymbol,
    totalTime,
  } = settings;

  const max = maxValue ? maxValue : Math.max(...values);
  const colMaxHeight = max / rows;
  const stepSize = Math.ceil(values.length / cols);
  const graph: (string | undefined)[][] = [...Array(rows)].map(() => []);
  const barHeights = [' '].concat(
    [...Array(8)].map((_, i) => String.fromCodePoint(0x2580 + (i + 1)))
  );
  values.length = stepSize * cols;

  for (let step = 0; step < values.length; step += stepSize) {
    const averageValue =
      [...values.slice(step, step + stepSize)].reduce(
        (sum, c) => (sum += c ?? 0),
        0
      ) / stepSize;
    const numFullCols = Math.floor(averageValue / colMaxHeight);

    for (let verticalStep = 0; verticalStep < rows; verticalStep++) {
      let x: number;

      if (verticalStep === numFullCols)
        x = Math.round(
          ((averageValue - numFullCols * colMaxHeight) / colMaxHeight) *
            (barHeights.length - 1)
        );
      else if (verticalStep > numFullCols) x = 0;
      else x = barHeights.length - 1;

      graph[verticalStep]?.push(barHeights[x]);
    }
  }

  const averageValue = (
    values.reduce((sum, c) => sum + c) / values.length
  ).toFixed(2);
  const symbol = valueSymbol ? ` ${valueSymbol}` : '';
  const width = cols + 4;
  const brush = LogStyles[type].brushFg.;

  console.log(
    graphLegendRow(title ?? '', `${max.toFixed(2)}${symbol}`, width, brush)
  );
  graph.reverse().forEach((row) => {
    console.log(brush(`│ ${row.join('')} │`));
  });
  console.log(
    graphLegendRow(
      `average: ${averageValue}${symbol}`,
      `0.00${symbol}`,
      width,
      brush
    )
  );
  if (totalTime) {
    console.log(
      graphLegendRow('0ms', formatMsTime(totalTime), width, sec.b.brightBlack)
    );
  }
};

const graphLegendRow = (
  leftText: string,
  rightText: string,
  graphCols: number,
  brush: CallableProperty
): string =>
  brush(`${leftText.padEnd(graphCols - rightText.length)}${rightText}`);

// documentation is repetitive to allow for better, useful tooltips
/**
 * Execution-scoped logger with convenience methods for each log level.
 *
 * All logging methods accept the same message format:
 * - a string
 * - an object (each property printed on a new line)
 * - an array (each item printed on a new line)
 *
 * An optional `title` may be provided to prefix the message.
 */
export type Logger = {
  /**
   * ---
   * Log message of a given type.
   *
   * @param type Type of the message.
   * @param message Simple text, object containing text properties or array of
   * values to display. Each object property or array item prints on a new line.
   * @param title Optional title of the message. Omit or set to undefined to
   * skip title rendering.
   */
  log(type: LogType, message: LogMessageContent, title?: LogTitleText): void;

  /**
   * ---
   * Plot info level graph values. Size, maximum value, title and the maximum value's
   * symbol are configurable.
   *
   * @param values List of numeric values to plot.
   * @param settings Optional settings. Includes the size of the plot in columns
   * and rows, optional maximum value (otherwise it's inferred from the values),
   * title and symbol to be placed next to the maximum value in the top row.
   */
  plot(values: number[], settings?: PlotSettings): void;

  /**
   * ---
   * Log a fatal error message that leads to an immediate halt of all
   * operations.
   *
   * @param message Simple text, object containing text properties or array of
   * values to display. Each object property or array item prints on a new line.
   * @param title Optional title of the message. Omit or set to undefined to
   * skip title rendering.
   */
  fatal(message: LogMessageContent, title?: LogTitleText): void;

  /**
   * ---
   * Log an error message that might lead to a halt of current operation.
   *
   * @param message Simple text, object containing text properties or array of
   * values to display. Each object property or array item prints on a new line.
   * @param title Optional title of the message. Omit or set to undefined to
   * skip title rendering.
   */
  error(message: LogMessageContent, title?: LogTitleText): void;

  /**
   * ---
   * Log a warning message that might produce an unexpected result later in the
   * execution process.
   *
   * @param message Simple text, object containing text properties or array of
   * values to display. Each object property or array item prints on a new line.
   * @param title Optional title of the message. Omit or set to undefined to
   * skip title rendering.
   */
  warning(message: LogMessageContent, title?: LogTitleText): void;

  /**
   * ---
   * Log a regular message that an important milestone of the execution flow was
   * reached. Something that will be of importance in production environment.
   *
   * @param message Simple text, object containing text properties or array of
   * values to display. Each object property or array item prints on a new line.
   * @param title Optional title of the message. Omit or set to undefined to
   * skip title rendering.
   */
  info(message: LogMessageContent, title?: LogTitleText): void;

  /**
   * ---
   * Log a debug message to review an important information that might help in
   * debugging a problem.
   *
   * @param message Simple text, object containing text properties or array of
   * values to display. Each object property or array item prints on a new line.
   * @param title Optional title of the message. Omit or set to undefined to
   * skip title rendering.
   */
  debug(message: LogMessageContent, title?: LogTitleText): void;

  /**
   * ---
   * Log a trace message to narrow an execution checkpoint. Stack trace is
   * attached to all trace logs.
   *
   * @param message Simple text, object containing text properties or array of
   * values to display. Each object property or array item prints on a new line.
   * @param title Optional title of the message. Omit or set to undefined to
   * skip title rendering.
   */
  trace(message: LogMessageContent, title?: LogTitleText): void;

  /**
   * ---
   * Log information that might be of importance during a close examination of
   * the execution flow.
   *
   * @param message Simple text, object containing text properties or array of
   * values to display. Each object property or array item prints on a new line.
   * @param title Optional title of the message. Omit or set to undefined to
   * skip title rendering.
   */
  verbose(message: LogMessageContent, title?: LogTitleText): void;
};

/**
 * Creates a pre-configured logger object that will display logs based on the
 * set log level. Includes shortcuts for the different type of logs.
 *
 * **types of logs:**
 * - fatal
 * - error
 * - info
 * - debug
 * - verbose
 *
 * @param logLevel Lowest level of logs to display. From suppressing logs
 * `'silent'` to full output of every logged action `'verbose'`.
 * @returns Object containing pre-configured logger with shortcut functions for
 * the different types of log messages.
 */
export const createLogger = (logLevel: LogLevel): Logger => {
  return {
    log(messageType, message, title) {
      logMessage(messageType, message, title, logLevel);
    },
    plot(values, settings) {
      plotValues('info', logLevel, values, settings);
    },

    fatal(message, title) {
      this.log('fatal', message, title);
    },
    error(message, title) {
      this.log('error', message, title);
    },
    warning(message, title) {
      this.log('warning', message, title);
    },
    info(message, title) {
      this.log('info', message, title);
    },
    debug(message, title) {
      this.log('debug', message, title);
    },
    trace(message, title) {
      this.log('trace', message, title);
    },
    verbose(message, title) {
      this.log('verbose', message, title);
    },
  };
};
