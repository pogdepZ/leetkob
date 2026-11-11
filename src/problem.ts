/**
 * Problem details (RFC 9457) for every error LeeTKOB returns.
 *
 * The registry below is the single source of truth. docs/contract/*.md lists the
 * same types, and test/contract/contract-doc.test.ts fails when the two drift apart.
 */
import type { FastifyReply } from 'fastify';

export const PROBLEM_BASE = 'https://leetkob.dev/problems/';

export const PROBLEMS = {
  unauthenticated: { status: 401, title: 'Authentication required' },
  'forbidden-role': { status: 403, title: 'Your role may not perform this action' },
  'lab-not-found': { status: 404, title: 'Lab not found' },
  'route-not-found': { status: 404, title: 'No such route' },
  'lab-open': { status: 409, title: 'Lab is still accepting submissions' },
  'reviews-pending': { status: 409, title: 'Reviews are still pending' },
  'malformed-body': { status: 400, title: 'Request body is not valid JSON' },
  'unsupported-media-type': { status: 415, title: 'Request body must be application/json' },
  'validation-failed': { status: 422, title: 'Request failed validation' },
  'internal-error': { status: 500, title: 'Unexpected server error' },
} as const;

export type ProblemSlug = keyof typeof PROBLEMS;

export interface FieldError {
  /** JSON Pointer (RFC 6901) into the request body, e.g. "/note". */
  pointer: string;
  message: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  [extension: string]: unknown;
}

export function problemType(slug: ProblemSlug): string {
  return `${PROBLEM_BASE}${slug}`;
}

export function problem(
  slug: ProblemSlug,
  detail: string,
  instance: string,
  extensions: Record<string, unknown> = {},
): ProblemDetails {
  const { status, title } = PROBLEMS[slug];
  return { type: problemType(slug), title, status, detail, instance, ...extensions };
}

/** Thrown by route handlers; the app's error handler turns it into problem+json. */
export class ProblemError extends Error {
  readonly body: ProblemDetails;
  readonly headers: Record<string, string>;

  constructor(body: ProblemDetails, headers: Record<string, string> = {}) {
    super(`${String(body.status)} ${body.type}`);
    this.name = 'ProblemError';
    this.body = body;
    this.headers = headers;
  }
}

export function sendProblem(
  reply: FastifyReply,
  body: ProblemDetails,
  headers: Record<string, string> = {},
) {
  for (const [name, value] of Object.entries(headers)) {
    void reply.header(name, value);
  }
  return reply.status(body.status).type('application/problem+json').send(body);
}
