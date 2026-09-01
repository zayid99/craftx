import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e6efb26eb911cef6f9d98c53792110c7@o4512005371854848.ingest.us.sentry.io/4512005378146305",

  enabled: process.env.NODE_ENV === "production",

  tracesSampleRate: 1,

  dataCollection: {
    // userInfo: false,
    // httpBodies: [],
  },
});