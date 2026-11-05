export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Readonly<Record<string, unknown>> | undefined;
  readonly timestamp: string;
};

type LogSink = (entry: LogEntry) => void;

const MAX_LOG_BUFFER = 100;
const logBuffer: LogEntry[] = [];
let activeSink: LogSink | null = null;

function record(
  level: LogLevel,
  message: string,
  context?: Readonly<Record<string, unknown>>,
): void {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  if (logBuffer.length >= MAX_LOG_BUFFER) {
    logBuffer.shift();
  }
  logBuffer.push(entry);

  if (activeSink) {
    activeSink(entry);
  }
}

export const logger = {
  debug(message: string, context?: Readonly<Record<string, unknown>>): void {
    record('debug', message, context);
  },
  info(message: string, context?: Readonly<Record<string, unknown>>): void {
    record('info', message, context);
  },
  warn(message: string, context?: Readonly<Record<string, unknown>>): void {
    record('warn', message, context);
  },
  error(message: string, context?: Readonly<Record<string, unknown>>): void {
    record('error', message, context);
  },
  setSink(sink: LogSink | null): void {
    activeSink = sink;
  },
  getEntries(): readonly LogEntry[] {
    return [...logBuffer];
  },
  clearEntries(): void {
    logBuffer.length = 0;
  },
};

