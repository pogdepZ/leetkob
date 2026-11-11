/**
 * POST /labs/{labId}/publish — the step that is hard to undo.
 * Contract: docs/contract/publish-lab.md. Change the contract first, then this file, then the tests.
 */
import type { FastifyInstance } from 'fastify';

import { authenticate } from '../auth.js';
import { problem, ProblemError, type FieldError } from '../problem.js';
import type { Publication, Store, User } from '../store.js';

export interface PublishDeps {
  store: Store;
  now: () => Date;
  newId: () => string;
}

export const NOTE_MAX_LENGTH = 500;

interface PublishBody {
  note?: string;
}

function parseBody(raw: unknown, instance: string): PublishBody {
  if (raw === undefined || raw === null) return {};
  const errors: FieldError[] = [];
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push({ pointer: '', message: 'body must be a JSON object' });
  } else {
    const body = raw as Record<string, unknown>;
    for (const key of Object.keys(body)) {
      if (key !== 'note') errors.push({ pointer: `/${key}`, message: 'unknown field' });
    }
    if ('note' in body) {
      const note = body.note;
      if (typeof note !== 'string') {
        errors.push({ pointer: '/note', message: 'must be a string' });
      } else if (note.trim().length === 0) {
        errors.push({ pointer: '/note', message: 'must not be blank' });
      } else if (note.length > NOTE_MAX_LENGTH) {
        errors.push({
          pointer: '/note',
          message: `must be at most ${String(NOTE_MAX_LENGTH)} characters`,
        });
      }
    }
  }
  if (errors.length > 0) {
    throw new ProblemError(
      problem('validation-failed', 'One or more fields are invalid; see errors.', instance, {
        errors,
      }),
    );
  }
  const body = raw as PublishBody;
  return body.note === undefined ? {} : { note: body.note };
}

function requireTa(user: User, instance: string): void {
  if (user.role !== 'ta') {
    throw new ProblemError(
      problem('forbidden-role', 'Only a TA may publish the marks of a lab.', instance, {
        role: user.role,
      }),
    );
  }
}

export function publishRoutes(app: FastifyInstance, deps: PublishDeps): void {
  app.post<{ Params: { labId: string }; Body: unknown }>(
    '/labs/:labId/publish',
    async (request, reply) => {
      const instance = request.url;
      const { labId } = request.params;

      // 1. Who is calling.
      const user = authenticate(request, deps.store);
      requireTa(user, instance);

      // 2. Whose lab. A lab outside the TA's classes looks exactly like a lab that does not exist.
      const lab = deps.store.lab(labId);
      if (lab === undefined || !user.classIds.includes(lab.classId)) {
        throw new ProblemError(
          problem('lab-not-found', `No lab ${labId} in your classes.`, instance),
        );
      }

      // 3. What was sent.
      const body = parseBody(request.body, instance);

      // 4. Safe to repeat: a published lab returns the original publication unchanged.
      const existing = deps.store.publication(labId);
      if (existing !== undefined) {
        return reply.status(200).header('Location', `/labs/${labId}/publication`).send(existing);
      }

      // 5. Nothing may still change after publishing: the lab must be closed ...
      const now = deps.now();
      if (new Date(lab.closesAt).getTime() > now.getTime()) {
        throw new ProblemError(
          problem(
            'lab-open',
            'The lab is still accepting submissions; wait until it closes.',
            instance,
            {
              closesAt: lab.closesAt,
            },
          ),
        );
      }

      // ... and every verdict in the review queue must have been seen by the TA.
      const items = deps.store.reviewItems(labId);
      const pending = items.filter((item) => item.reviewState === 'pending').length;
      if (pending > 0) {
        throw new ProblemError(
          problem(
            'reviews-pending',
            `${String(pending)} verdict(s) are waiting for your review.`,
            instance,
            {
              pending,
              reviewQueue: `/labs/${labId}/review-queue`,
            },
          ),
        );
      }

      // 6. Publish.
      const publication: Publication = {
        publicationId: deps.newId(),
        labId,
        publishedAt: now.toISOString(),
        publishedBy: user.id,
        note: body.note ?? null,
        counts: {
          submissions: deps.store.submissionCount(labId),
          verdicts: items.length,
          pass: items.filter((item) => item.verdict === 'pass').length,
          violation: items.filter((item) => item.verdict === 'violation').length,
          unsure: items.filter((item) => item.verdict === 'unsure').length,
          reviewed: items.filter((item) => item.reviewState === 'confirmed').length,
        },
      };
      deps.store.savePublication(publication);
      return reply.status(201).header('Location', `/labs/${labId}/publication`).send(publication);
    },
  );
}
