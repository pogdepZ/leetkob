/**
 * Contract tests for POST /labs/{labId}/publish — docs/contract/publish-lab.md.
 * One block per section of the contract. If a test here has to change, the contract changes first.
 */
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PROBLEM_BASE, type ProblemSlug } from '../../src/problem.js';
import { makeApp, NOW, TOKENS } from '../fixtures.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = makeApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

interface CallOptions {
  token?: string | undefined;
  rawAuthorization?: string;
  body?: unknown;
  rawBody?: string;
  contentType?: string;
}

async function publish(labId: string, options: CallOptions = {}) {
  const headers: Record<string, string> = {};
  if (options.rawAuthorization !== undefined) headers.authorization = options.rawAuthorization;
  else if (options.token !== undefined) headers.authorization = `Bearer ${options.token}`;
  if (options.contentType !== undefined) headers['content-type'] = options.contentType;

  const hasBody = options.body !== undefined || options.rawBody !== undefined;
  if (hasBody && headers['content-type'] === undefined)
    headers['content-type'] = 'application/json';

  return app.inject({
    method: 'POST',
    url: `/labs/${labId}/publish`,
    headers,
    ...(options.rawBody !== undefined
      ? { payload: options.rawBody }
      : options.body !== undefined
        ? { payload: JSON.stringify(options.body) }
        : {}),
  });
}

/** Asserts the full RFC 9457 shape the contract promises, then returns the parsed body. */
function expectProblem(
  response: { statusCode: number; headers: Record<string, unknown>; body: string },
  slug: ProblemSlug,
  status: number,
  labId: string,
) {
  expect(response.statusCode).toBe(status);
  expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
  const body = JSON.parse(response.body) as Record<string, unknown>;
  expect(body.type).toBe(`${PROBLEM_BASE}${slug}`);
  expect(typeof body.title).toBe('string');
  expect(body.status).toBe(status);
  expect(typeof body.detail).toBe('string');
  expect(body.instance).toBe(`/labs/${labId}/publish`);
  return body;
}

describe('Who may call it', () => {
  it('401 unauthenticated: no Authorization header', async () => {
    const res = await publish('lab_ready');
    expectProblem(res, 'unauthenticated', 401, 'lab_ready');
    expect(res.headers['www-authenticate']).toBe('Bearer realm="leetkob"');
  });

  it('401 unauthenticated: a scheme other than Bearer', async () => {
    const res = await publish('lab_ready', { rawAuthorization: 'Basic dGE6dGE=' });
    expectProblem(res, 'unauthenticated', 401, 'lab_ready');
  });

  it('401 unauthenticated: unknown token', async () => {
    const res = await publish('lab_ready', { token: 'tok-nobody' });
    expectProblem(res, 'unauthenticated', 401, 'lab_ready');
  });

  it('403 forbidden-role: a student', async () => {
    const res = await publish('lab_ready', { token: TOKENS.student });
    const body = expectProblem(res, 'forbidden-role', 403, 'lab_ready');
    expect(body.role).toBe('student');
  });

  it('403 forbidden-role: an admin', async () => {
    const res = await publish('lab_ready', { token: TOKENS.admin });
    const body = expectProblem(res, 'forbidden-role', 403, 'lab_ready');
    expect(body.role).toBe('admin');
  });

  it("404 lab-not-found: another TA's lab is indistinguishable from a missing lab", async () => {
    const other = await publish('lab_b', { token: TOKENS.taA });
    const missing = await publish('lab_nope', { token: TOKENS.taA });
    expectProblem(other, 'lab-not-found', 404, 'lab_b');
    expectProblem(missing, 'lab-not-found', 404, 'lab_nope');
    const strip = (s: string) => s.replace(/lab_(b|nope)/g, 'lab_X');
    expect(strip(other.body)).toBe(strip(missing.body));
  });

  it('role is checked before ownership: a student on a missing lab gets 403, not 404', async () => {
    const res = await publish('lab_nope', { token: TOKENS.student });
    expectProblem(res, 'forbidden-role', 403, 'lab_nope');
  });

  it('404 lab-not-found: a labId outside [A-Za-z0-9_-] or longer than 64 characters', async () => {
    const encodedSlash = await publish('lab%2Fready', { token: TOKENS.taA });
    const tooLong = await publish('l'.repeat(65), { token: TOKENS.taA });
    expectProblem(encodedSlash, 'lab-not-found', 404, 'lab%2Fready');
    expectProblem(tooLong, 'lab-not-found', 404, 'l'.repeat(65));
  });

  it('ownership is checked before the body: a bad body on a foreign lab gets 404, not 422', async () => {
    const res = await publish('lab_b', { token: TOKENS.taA, body: { bogus: 1 } });
    expectProblem(res, 'lab-not-found', 404, 'lab_b');
  });
});

describe('Request', () => {
  it('415 unsupported-media-type: a body that is not JSON', async () => {
    const res = await publish('lab_ready', {
      token: TOKENS.taA,
      rawBody: 'note=hi',
      contentType: 'application/x-www-form-urlencoded',
    });
    expectProblem(res, 'unsupported-media-type', 415, 'lab_ready');
  });

  it('400 malformed-body: unparseable JSON', async () => {
    const res = await publish('lab_ready', { token: TOKENS.taA, rawBody: '{"note": ' });
    expectProblem(res, 'malformed-body', 400, 'lab_ready');
  });

  it('400 malformed-body: empty body with a JSON content type', async () => {
    const res = await publish('lab_ready', {
      token: TOKENS.taA,
      rawBody: '',
      contentType: 'application/json',
    });
    expectProblem(res, 'malformed-body', 400, 'lab_ready');
  });

  it('422 validation-failed: note too long, with a JSON Pointer', async () => {
    const res = await publish('lab_ready', { token: TOKENS.taA, body: { note: 'x'.repeat(501) } });
    const body = expectProblem(res, 'validation-failed', 422, 'lab_ready');
    expect(body.errors).toEqual([{ pointer: '/note', message: 'must be at most 500 characters' }]);
  });

  it('422 validation-failed: blank note, wrong type, unknown field (one error each)', async () => {
    const blank = await publish('lab_ready', { token: TOKENS.taA, body: { note: '   ' } });
    expect(expectProblem(blank, 'validation-failed', 422, 'lab_ready').errors).toEqual([
      { pointer: '/note', message: 'must not be blank' },
    ]);

    const wrongType = await publish('lab_ready', { token: TOKENS.taA, body: { note: 42 } });
    expect(expectProblem(wrongType, 'validation-failed', 422, 'lab_ready').errors).toEqual([
      { pointer: '/note', message: 'must be a string' },
    ]);

    const unknown = await publish('lab_ready', {
      token: TOKENS.taA,
      body: { note: 'ok', extra: 1 },
    });
    expect(expectProblem(unknown, 'validation-failed', 422, 'lab_ready').errors).toEqual([
      { pointer: '/extra', message: 'unknown field' },
    ]);
  });

  it('422 validation-failed: body is not an object', async () => {
    const res = await publish('lab_ready', { token: TOKENS.taA, body: ['note'] });
    const body = expectProblem(res, 'validation-failed', 422, 'lab_ready');
    expect(body.errors).toEqual([{ pointer: '', message: 'body must be a JSON object' }]);
  });
});

describe('Refusals', () => {
  it('409 lab-open: the deadline has not passed', async () => {
    const res = await publish('lab_open', { token: TOKENS.taA });
    const body = expectProblem(res, 'lab-open', 409, 'lab_open');
    expect(body.closesAt).toBe('2026-12-01T15:00:00Z');
  });

  it('409 reviews-pending: counts the queue and points at it', async () => {
    const res = await publish('lab_pending', { token: TOKENS.taA });
    const body = expectProblem(res, 'reviews-pending', 409, 'lab_pending');
    expect(body.pending).toBe(2);
    expect(body.reviewQueue).toBe('/labs/lab_pending/review-queue');
  });

  it('a refused lab is not published: a repeat still gets the same 409', async () => {
    const again = await publish('lab_pending', { token: TOKENS.taA });
    expectProblem(again, 'reviews-pending', 409, 'lab_pending');
  });
});

describe('Response and idempotency', () => {
  it('201 Created on the first call, with Location and the documented shape', async () => {
    const res = await publish('lab_ready', { token: TOKENS.taA, body: { note: 'Marks are out.' } });
    expect(res.statusCode).toBe(201);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
    expect(res.headers.location).toBe('/labs/lab_ready/publication');
    expect(res.json()).toEqual({
      publicationId: 'pub_0001',
      labId: 'lab_ready',
      publishedAt: NOW.toISOString(),
      publishedBy: 'ta_a',
      note: 'Marks are out.',
      counts: { submissions: 3, verdicts: 4, pass: 2, violation: 1, unsure: 1 },
    });
  });

  it('200 OK on a repeat, byte for byte the original, even with a different note', async () => {
    const first = await publish('lab_ready', { token: TOKENS.taA });
    const second = await publish('lab_ready', { token: TOKENS.taA, body: { note: 'changed' } });
    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.headers.location).toBe('/labs/lab_ready/publication');
    expect(first.json()).toMatchObject({ publicationId: 'pub_0001', note: 'Marks are out.' });
    expect(second.body).toBe(first.body);
  });

  it('a malformed repeat still gets 422, not the idempotent 200', async () => {
    const res = await publish('lab_ready', { token: TOKENS.taA, body: { note: '' } });
    expectProblem(res, 'validation-failed', 422, 'lab_ready');
  });

  it('the repeat still obeys ownership: another TA gets 404 on a published lab', async () => {
    const res = await publish('lab_ready', { token: TOKENS.taB });
    expectProblem(res, 'lab-not-found', 404, 'lab_ready');
  });

  it('publishing without a body gives note: null', async () => {
    const app2 = makeApp();
    await app2.ready();
    try {
      const res = await app2.inject({
        method: 'POST',
        url: '/labs/lab_ready/publish',
        headers: { authorization: `Bearer ${TOKENS.taA}` },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toMatchObject({ note: null });
    } finally {
      await app2.close();
    }
  });
});

describe('Routing', () => {
  it('404 route-not-found: a path that is not a route', async () => {
    const res = await app.inject({ method: 'POST', url: '/labs/lab_ready' });
    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(res.json<{ type: string }>().type).toBe(`${PROBLEM_BASE}route-not-found`);
  });
});
