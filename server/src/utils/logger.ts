import pino from "pino";

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || "ddb-server";
const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "";

/**
 * When an OTLP endpoint is configured (Signoz collector), every log line is
 * shipped there *and* still written to stdout for `docker logs`.
 */
function transport(): pino.LoggerOptions["transport"] {
  if (!OTLP_ENDPOINT) return undefined;
  return {
    targets: [
      { target: "pino/file", options: { destination: 1 } },
      {
        target: "pino-opentelemetry-transport",
        options: {
          loggerName: SERVICE_NAME,
          serviceVersion: process.env.npm_package_version || "1.0.0",
          resourceAttributes: {
            "service.name": SERVICE_NAME,
            "deployment.environment": process.env.NODE_ENV || "development",
          },
        },
      },
    ],
  };
}

/**
 * Structured application logger. JSON to stdout always; mirrored to the
 * Signoz OTel collector when OTEL_EXPORTER_OTLP_ENDPOINT is set.
 */
export const logger = pino({
  name: SERVICE_NAME,
  level: process.env.LOG_LEVEL || "info",
  base: {
    env: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: transport(),
});
