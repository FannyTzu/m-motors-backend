import * as Sentry from "@sentry/node";

/** CATH ERROR WITH CONTEXT*/
export const captureError = (
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: "fatal" | "error" | "warning" | "info";
  },
) => {
  Sentry.captureException(error, {
    level: context?.level || "error",
    tags: context?.tags,
    extra: context?.extra,
  });
};

/*breadcrumb*/
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>,
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
    timestamp: Date.now() / 1000,
  });
};

/*wrapper*/
export const catchAsync = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      captureError(error, {
        tags: {
          route: req.path,
          method: req.method,
        },
        extra: {
          body: req.body,
          params: req.params,
          query: req.query,
        },
      });
      next(error);
    });
  };
};
