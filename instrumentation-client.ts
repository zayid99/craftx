import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e6efb26eb911cef6f9d98c53792110c7@o4512005371854848.ingest.us.sentry.io/4512005378146305",

  enabled: process.env.NODE_ENV === "production",

  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: 1,

  replaysSessionSampleRate: 0.1,

  replaysOnErrorSampleRate: 1.0,

  dataCollection: {
    // userInfo: false,
    // httpBodies: [],
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;