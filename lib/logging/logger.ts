// Lightweight structured logger. Outputs single-line JSON so it's easy to
// scan or grep in Hostinger's log viewer / PM2 logs, and also reports
// errors to Sentry (production only, per the Sentry config files) so you
// get a dashboard + alerting on top of raw logs, from one function call.

import { randomUUID } from "crypto";
import * as Sentry from "@sentry/nextjs";

export function createRequestId(): string {
  return randomUUID();
}

interface LogContext {
  requestId: string;
  route: string;
  userId?: string;
  [key: string]: unknown;
}

function write(level: "info" | "warn" | "error", message: string, context: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, context: LogContext) => write("info", message, context),
  warn: (message: string, context: LogContext) => write("warn", message, context),
  error: (message: string, context: LogContext & { error?: unknown }) => {
    const { error, userId, requestId, route, ...rest } = context;
    write("error", message, {
      requestId,
      route,
      userId,
      ...rest,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    Sentry.withScope((scope) => {
      scope.setTag("route", route);
      scope.setTag("requestId", requestId);
      if (userId) {
        scope.setUser({ id: userId });
      }
      for (const [key, value] of Object.entries(rest)) {
        scope.setExtra(key, value);
      }

      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, "error");
      }
    });
  },
};