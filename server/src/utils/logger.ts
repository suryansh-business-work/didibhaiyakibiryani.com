import pino from "pino";

/**
 * Structured application logger. JSON output in production (scraped into the
 * observability pipeline / Signoz); pretty-printable in dev via `pino-pretty`.
 */
export const logger = pino({
  name: process.env.OTEL_SERVICE_NAME || "ddb-server",
  level: process.env.LOG_LEVEL || "info",
  base: {
    env: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
