/**
 * OpenTelemetry bootstrap — MUST be imported before anything else so the
 * auto-instrumentations can patch http/express/graphql/mongoose/dns/fetch.
 * Sends traces to the Signoz collector when OTEL_EXPORTER_OTLP_ENDPOINT is
 * set (e.g. http://host.docker.internal:4318); a no-op otherwise.
 */
import "dotenv/config";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (endpoint) {
  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || "ddb-server",
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // fs spans are extremely noisy and rarely useful here
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });
  sdk.start();
  process.on("SIGTERM", () => {
    sdk.shutdown().catch(() => undefined);
  });
  // eslint-disable-next-line no-console
  console.log(`[otel] tracing enabled → ${endpoint}`);
}
