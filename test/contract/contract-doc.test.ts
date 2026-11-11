/**
 * The contract file and the code must list the same problem types.
 * A type added to the code without a row in the contract fails here, and so does the reverse.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { PROBLEMS } from '../../src/problem.js';

const CONTRACT = readFileSync(
  new URL('../../docs/contract/publish-lab.md', import.meta.url),
  'utf8',
);

/** Rows of the "Types this endpoint can return" table: | `slug` | status | ... */
function documentedTypes(): Map<string, number> {
  const rows = new Map<string, number>();
  for (const match of CONTRACT.matchAll(/^\|\s*`([a-z-]+)`\s*\|\s*(\d{3})\s*\|/gm)) {
    const [, slug, status] = match;
    if (slug !== undefined && status !== undefined) rows.set(slug, Number(status));
  }
  return rows;
}

describe('docs/contract/publish-lab.md matches src/problem.ts', () => {
  const documented = documentedTypes();

  it('the table was found', () => {
    expect(documented.size).toBeGreaterThan(5);
  });

  it('every documented type exists in the code with the documented status', () => {
    for (const [slug, status] of documented) {
      expect(PROBLEMS, `type ${slug} is in the contract but not in src/problem.ts`).toHaveProperty(
        slug,
      );
      expect(PROBLEMS[slug as keyof typeof PROBLEMS].status, `status of ${slug}`).toBe(status);
    }
  });

  it('every type in the code is documented', () => {
    for (const slug of Object.keys(PROBLEMS)) {
      expect(
        documented.has(slug),
        `type ${slug} is in src/problem.ts but not in the contract`,
      ).toBe(true);
    }
  });

  it('the contract names its tests', () => {
    expect(CONTRACT).toContain('test/contract/publish.contract.test.ts');
  });
});
