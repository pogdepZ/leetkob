import { describe, expect, it } from 'vitest';

import { problem, PROBLEM_BASE, PROBLEMS } from '../../src/problem.js';

describe('problem()', () => {
  it('builds the five RFC 9457 members plus extensions', () => {
    const body = problem('reviews-pending', '2 left', '/labs/x/publish', { pending: 2 });
    expect(body).toEqual({
      type: `${PROBLEM_BASE}reviews-pending`,
      title: PROBLEMS['reviews-pending'].title,
      status: 409,
      detail: '2 left',
      instance: '/labs/x/publish',
      pending: 2,
    });
  });

  it('takes status and title from the registry, not from the caller', () => {
    const body = problem('lab-open', 'd', '/i', { closesAt: '2099-01-01T00:00:00Z' });
    expect(body.status).toBe(PROBLEMS['lab-open'].status);
    expect(body.title).toBe(PROBLEMS['lab-open'].title);
  });
});
