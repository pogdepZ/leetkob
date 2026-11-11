/**
 * Development seed. Tokens here are not secrets: they only exist in the in-memory PA#2 store
 * and are replaced by real sessions in PA#3. Never put a real credential in this file.
 */
import type { Seed } from './store.js';

export function devSeed(): Seed {
  return {
    tokens: {
      'dev-ta-a': { id: 'ta_a', role: 'ta', classIds: ['class_a'] },
      'dev-ta-b': { id: 'ta_b', role: 'ta', classIds: ['class_b'] },
      'dev-student': { id: 'student_1', role: 'student', classIds: [] },
      'dev-admin': { id: 'admin_1', role: 'admin', classIds: [] },
    },
    labs: [
      { id: 'lab_sorting', classId: 'class_a', title: 'Sorting', closesAt: '2026-11-01T15:00:00Z' },
      { id: 'lab_open', classId: 'class_a', title: 'Recursion', closesAt: '2099-01-01T00:00:00Z' },
      {
        id: 'lab_pending',
        classId: 'class_a',
        title: 'Linked lists',
        closesAt: '2026-11-01T15:00:00Z',
      },
      {
        id: 'lab_other',
        classId: 'class_b',
        title: 'Sorting (class B)',
        closesAt: '2026-11-01T15:00:00Z',
      },
    ],
    reviewItems: [
      {
        id: 'r1',
        labId: 'lab_sorting',
        submissionId: 's01',
        constraintId: 'C1',
        verdict: 'pass',
        reviewState: 'confirmed',
      },
      {
        id: 'r2',
        labId: 'lab_sorting',
        submissionId: 's02',
        constraintId: 'C1',
        verdict: 'violation',
        reviewState: 'confirmed',
      },
      {
        id: 'r3',
        labId: 'lab_sorting',
        submissionId: 's03',
        constraintId: 'C1',
        verdict: 'unsure',
        reviewState: 'confirmed',
      },
      {
        id: 'r4',
        labId: 'lab_pending',
        submissionId: 's10',
        constraintId: 'C1',
        verdict: 'violation',
        reviewState: 'pending',
      },
      {
        id: 'r5',
        labId: 'lab_pending',
        submissionId: 's11',
        constraintId: 'C1',
        verdict: 'pass',
        reviewState: 'confirmed',
      },
    ],
    submissionCounts: { lab_sorting: 3, lab_pending: 2, lab_open: 0, lab_other: 4 },
  };
}
