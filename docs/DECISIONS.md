# Decisions

Short records of choices a stranger (or our PA#4 red team) might question.

## D1 — One Node process, in-memory store, for PA#2

The original proposal had three services in three languages and five data stores. PA#2 marks
the harness, not the architecture, so the smallest thing that can carry a real contract and
real contract tests is one Fastify process with a `Store` interface and a memory
implementation. PA#3 adds a database and a queue behind that interface. The contract tests
run against `app.inject()` and will not change when the store does.

## D2 — The endpoint for the contract: `POST /labs/{labId}/publish`

Of the four candidates in the rubric this is the one whose mistakes are hardest to undo:
marks that students have already seen. It has an ownership rule (the TA's own classes), two
refusals that protect students (`lab-open`, `reviews-pending`) and natural idempotency (the
lab is the key). Paging does not apply and the contract says so.

## D3 — `404`, not `403`, for another TA's lab

A `403` would confirm that the lab ID exists. The contract makes a foreign lab and a missing
lab answer identically, and a test asserts the two bodies are the same.

## D4 — Problem types are a registry

`src/problem.ts` is the only place a status or title is written. The contract's error table is
checked against it by a test, so a new error cannot ship undocumented and a documented error
cannot vanish from the code.

## D5 — Four CI jobs, one per check, with the README's script names

A single job that runs everything hides which check failed and lets one check mask another.
Four jobs named after the npm scripts are four required status checks on `main`.
