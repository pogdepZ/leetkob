import { buildApp } from '../src/app.js';
import { MemoryStore, type Seed } from '../src/store.js';

export const TOKENS = {
  taA: 'tok-ta-a',
  taB: 'tok-ta-b',
  student: 'tok-student',
  admin: 'tok-admin',
} as const;

export const NOW = new Date('2026-11-09T14:02:11.000Z');

export function seed(): Seed {
  return {
    tokens: {
      [TOKENS.taA]: { id: 'ta_a', role: 'ta', classIds: ['class_a'] },
      [TOKENS.taB]: { id: 'ta_b', role: 'ta', classIds: ['class_b'] },
      [TOKENS.student]: { id: 'student_1', role: 'student', classIds: [] },
      [TOKENS.admin]: { id: 'admin_1', role: 'admin', classIds: [] },
    },
    labs: [
      { id: 'lab_ready', classId: 'class_a', title: 'Sorting', closesAt: '2026-11-01T15:00:00Z' },
      { id: 'lab_open', classId: 'class_a', title: 'Recursion', closesAt: '2026-12-01T15:00:00Z' },
      { id: 'lab_pending', classId: 'class_a', title: 'Lists', closesAt: '2026-11-01T15:00:00Z' },
      { id: 'lab_b', classId: 'class_b', title: 'Sorting B', closesAt: '2026-11-01T15:00:00Z' },
    ],
    reviewItems: [
      {
        id: 'r1',
        labId: 'lab_ready',
        submissionId: 's01',
        constraintId: 'C1',
        verdict: 'pass',
        reviewState: 'confirmed',
      },
      {
        id: 'r2',
        labId: 'lab_ready',
        submissionId: 's01',
        constraintId: 'C2',
        verdict: 'pass',
        reviewState: 'confirmed',
      },
      {
        id: 'r3',
        labId: 'lab_ready',
        submissionId: 's02',
        constraintId: 'C1',
        verdict: 'violation',
        reviewState: 'confirmed',
      },
      {
        id: 'r4',
        labId: 'lab_ready',
        submissionId: 's03',
        constraintId: 'C1',
        verdict: 'unsure',
        reviewState: 'confirmed',
      },
      {
        id: 'r5',
        labId: 'lab_pending',
        submissionId: 's10',
        constraintId: 'C1',
        verdict: 'violation',
        reviewState: 'pending',
      },
      {
        id: 'r6',
        labId: 'lab_pending',
        submissionId: 's11',
        constraintId: 'C1',
        verdict: 'unsure',
        reviewState: 'pending',
      },
      {
        id: 'r7',
        labId: 'lab_pending',
        submissionId: 's12',
        constraintId: 'C1',
        verdict: 'pass',
        reviewState: 'confirmed',
      },
    ],
    submissionCounts: { lab_ready: 3, lab_pending: 3, lab_open: 1, lab_b: 4 },
  };
}

export function makeApp() {
  let n = 0;
  return buildApp({
    store: new MemoryStore(seed()),
    now: () => NOW,
    newId: () => `pub_${String(++n).padStart(4, '0')}`,
  });
}
