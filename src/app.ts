import Fastify, { type FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';

import { problem, ProblemError, sendProblem } from './problem.js';
import { healthRoutes } from './routes/health.js';
import { publishRoutes } from './routes/publish.js';
import type { Store } from './store.js';

export interface AppOptions {
  store: Store;
  now?: () => Date;
  newId?: () => string;
  logger?: boolean;
}

export function buildApp(options: AppOptions): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });
  const deps = {
    store: options.store,
    now: options.now ?? (() => new Date()),
    newId: options.newId ?? (() => randomUUID()),
  };

  app.setNotFoundHandler((request, reply) =>
    sendProblem(
      reply,
      problem('route-not-found', `${request.method} ${request.url} is not a route.`, request.url),
    ),
  );

  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof ProblemError) {
      return sendProblem(reply, error.body, error.headers);
    }
    const code = (error as { code?: string }).code ?? '';
    if (code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
      return sendProblem(
        reply,
        problem('unsupported-media-type', 'Send the body as application/json.', request.url),
      );
    }
    if (code === 'FST_ERR_CTP_EMPTY_JSON_BODY' || code === 'FST_ERR_CTP_INVALID_JSON_BODY') {
      return sendProblem(
        reply,
        problem('malformed-body', 'The body could not be parsed as JSON.', request.url),
      );
    }
    request.log.error(error);
    return sendProblem(
      reply,
      problem('internal-error', 'Something went wrong on our side.', request.url),
    );
  });

  healthRoutes(app);
  publishRoutes(app, deps);
  return app;
}
