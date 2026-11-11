/**
 * In-memory repository for PA#2. PA#3 swaps this for a database behind the same interface;
 * the contract tests do not care which one is underneath.
 */

export type Role = 'admin' | 'ta' | 'student';

export interface User {
  id: string;
  role: Role;
  /** Classes a TA belongs to. Empty for other roles. */
  classIds: readonly string[];
}

export interface Lab {
  id: string;
  classId: string;
  title: string;
  /** ISO 8601. Submissions are accepted until this instant. */
  closesAt: string;
}

export type Verdict = 'pass' | 'violation' | 'unsure';

export interface ReviewItem {
  id: string;
  labId: string;
  submissionId: string;
  constraintId: string;
  verdict: Verdict;
  /** A violation, an unsure, or a sampled pass waits for the TA; the rest are confirmed. */
  reviewState: 'pending' | 'confirmed';
}

export interface Publication {
  publicationId: string;
  labId: string;
  publishedAt: string;
  publishedBy: string;
  note: string | null;
  counts: {
    submissions: number;
    verdicts: number;
    pass: number;
    violation: number;
    unsure: number;
  };
}

export interface Store {
  userByToken(token: string): User | undefined;
  lab(labId: string): Lab | undefined;
  reviewItems(labId: string): readonly ReviewItem[];
  submissionCount(labId: string): number;
  publication(labId: string): Publication | undefined;
  savePublication(publication: Publication): void;
}

export interface Seed {
  tokens: Record<string, User>;
  labs: Lab[];
  reviewItems: ReviewItem[];
  submissionCounts: Record<string, number>;
}

export class MemoryStore implements Store {
  private readonly tokens: Map<string, User>;
  private readonly labs: Map<string, Lab>;
  private readonly items: ReviewItem[];
  private readonly submissionCounts: Map<string, number>;
  private readonly publications = new Map<string, Publication>();

  constructor(seed: Seed) {
    this.tokens = new Map(Object.entries(seed.tokens));
    this.labs = new Map(seed.labs.map((lab) => [lab.id, lab]));
    this.items = [...seed.reviewItems];
    this.submissionCounts = new Map(Object.entries(seed.submissionCounts));
  }

  userByToken(token: string): User | undefined {
    return this.tokens.get(token);
  }

  lab(labId: string): Lab | undefined {
    return this.labs.get(labId);
  }

  reviewItems(labId: string): readonly ReviewItem[] {
    return this.items.filter((item) => item.labId === labId);
  }

  submissionCount(labId: string): number {
    return this.submissionCounts.get(labId) ?? 0;
  }

  publication(labId: string): Publication | undefined {
    return this.publications.get(labId);
  }

  savePublication(publication: Publication): void {
    this.publications.set(publication.labId, publication);
  }
}
