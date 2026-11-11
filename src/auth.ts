import type { FastifyRequest } from 'fastify';

import { problem, ProblemError } from './problem.js';
import type { Store, User } from './store.js';

const BEARER = /^Bearer\s+(\S+)$/i;

/**
 * PA#2 authentication: a static bearer token mapped to a seeded user.
 * PA#3 replaces the token source with real sessions; the header and the 401 stay the same.
 */
export function authenticate(request: FastifyRequest, store: Store): User {
  const header = request.headers.authorization;
  const match = header === undefined ? null : BEARER.exec(header);
  const user = match?.[1] === undefined ? undefined : store.userByToken(match[1]);
  if (user === undefined) {
    throw new ProblemError(
      problem(
        'unauthenticated',
        'Send a valid bearer token in the Authorization header.',
        request.url,
      ),
      { 'WWW-Authenticate': 'Bearer realm="leetkob"' },
    );
  }
  return user;
}
