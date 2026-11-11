# Contract — `POST /labs/{labId}/publish`

Publish the marks of a lab. This is the step in LeeTKOB that is hard to undo: once marks are
published, students see their deductions and may appeal. Everything before it costs nothing to
fix; everything after it costs the TA time and credibility. The endpoint therefore refuses
unless every verdict has been reviewed, and it is safe to call again.

|                 |                                                                                |
| --------------- | ------------------------------------------------------------------------------ |
| Method and path | `POST /labs/{labId}/publish`                                                   |
| Version         | 1 (see [What happens when it changes](#what-happens-when-it-changes))          |
| Implementation  | `src/routes/publish.ts`                                                        |
| Tests           | `test/contract/publish.contract.test.ts`, `test/contract/contract-doc.test.ts` |
| Status          | current, since PA#2                                                            |

## Who may call it

| Rule           | Detail                                                                                                                                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication | `Authorization: Bearer <access token>`. Missing, malformed or unknown token → `401 unauthenticated`.                                                                                                                                                            |
| Role           | `ta` only. A `student` or an `admin` → `403 forbidden-role`. Admins manage accounts and classes; they do not mark labs.                                                                                                                                         |
| Ownership      | The lab must belong to a class the TA is a member of. A lab in another TA's class and a lab that does not exist both → `404 lab-not-found`. The response is the same on purpose: the caller cannot find out whether a lab ID exists in a class they are not in. |

The checks run in that order (authentication, then role, then ownership), before the body is read.
A student sending garbage gets `403`, not `422`.

## Request

### Path

| Parameter | Type   | Rule                                                                                                     |
| --------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `labId`   | string | 1–64 characters, `[A-Za-z0-9_-]`. Any other value, including a URL-encoded slash, → `404 lab-not-found`. |

### Headers

| Header          | Required                 | Rule                                                                                                                          |
| --------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `Authorization` | yes                      | `Bearer <token>`                                                                                                              |
| `Content-Type`  | only when a body is sent | must be `application/json` (parameters such as `; charset=utf-8` are accepted). Anything else → `415 unsupported-media-type`. |

### Body

The body is optional. When present it is a JSON object:

| Field  | Type   | Required | Rule                                                                                                                          |
| ------ | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `note` | string | no       | 1–500 characters, raw length (no trimming). A string that is only whitespace is rejected. Shown to students with their marks. |

Any field other than `note` → `422 validation-failed` (`"unknown field"`). A body that is not a JSON
object (an array, a number, a string) → `422 validation-failed` with pointer `""`. A body that is
not parseable JSON, or an empty body sent with `Content-Type: application/json`, →
`400 malformed-body`.

```http
POST /labs/lab_sorting/publish HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{ "note": "Marks for the Sorting lab. Appeals open for 7 days." }
```

## Response

### `201 Created` — the lab was published by this call

Headers: `Location: /labs/{labId}/publication`, `Content-Type: application/json`.

```json
{
  "publicationId": "6e4f0e5a-9a46-4a0d-93a6-0c1d6d0f7a51",
  "labId": "lab_sorting",
  "publishedAt": "2026-11-09T14:02:11.000Z",
  "publishedBy": "ta_a",
  "note": "Marks for the Sorting lab. Appeals open for 7 days.",
  "counts": { "submissions": 80, "verdicts": 240, "pass": 221, "violation": 15, "unsure": 4 }
}
```

| Field                                              | Type                 | Rule                                                                                                                                                       |
| -------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `publicationId`                                    | string (UUID)        | Stable for the lifetime of the publication.                                                                                                                |
| `labId`                                            | string               | Echo of the path parameter.                                                                                                                                |
| `publishedAt`                                      | string, ISO 8601 UTC | Set once, on the first successful call.                                                                                                                    |
| `publishedBy`                                      | string               | User ID of the TA who published.                                                                                                                           |
| `note`                                             | string or `null`     | The note from the first successful call, or `null`.                                                                                                        |
| `counts.submissions`                               | integer ≥ 0          | Accepted submissions the lab had when it was published.                                                                                                    |
| `counts.verdicts`                                  | integer ≥ 0          | Verdicts published; `= pass + violation + unsure`.                                                                                                         |
| `counts.pass`, `counts.violation`, `counts.unsure` | integer ≥ 0          | Verdicts by outcome. An `unsure` verdict that the TA confirmed is still reported as `unsure`: the TA's decision lives on the submission's marks, not here. |

### `200 OK` — the lab was already published

Same headers and the same body as the original `201`, byte for byte (same `publicationId`,
same `publishedAt`, same `note`). See [Idempotency](#idempotency).

## Errors

Every error is a problem-details document ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)),
sent as `Content-Type: application/problem+json`, with these members:

| Member     | Always present | Meaning                                                                                                                   |
| ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `type`     | yes            | `https://leetkob.dev/problems/<slug>`. A stable identifier, not a page to fetch. Match on it, not on `title` or `detail`. |
| `title`    | yes            | Short human summary of the type. Fixed per type.                                                                          |
| `status`   | yes            | Same as the HTTP status.                                                                                                  |
| `detail`   | yes            | Human explanation of this occurrence. May change between releases; never parse it.                                        |
| `instance` | yes            | The request path.                                                                                                         |

Types this endpoint can return, in the order they are checked:

| `type` (slug)            | Status | When                                                                                                                         | Extension members                                                                             |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `unauthenticated`        | 401    | No `Authorization` header, not `Bearer`, or unknown token. Response also carries `WWW-Authenticate: Bearer realm="leetkob"`. | —                                                                                             |
| `forbidden-role`         | 403    | The caller is authenticated but is not a TA.                                                                                 | `role`: the caller's role.                                                                    |
| `lab-not-found`          | 404    | No such lab, or the lab's class is not one of the TA's classes.                                                              | —                                                                                             |
| `unsupported-media-type` | 415    | A body was sent with a `Content-Type` other than `application/json`.                                                         | —                                                                                             |
| `malformed-body`         | 400    | The body is not valid JSON (includes an empty body with a JSON content type).                                                | —                                                                                             |
| `validation-failed`      | 422    | The body is JSON but breaks a field rule.                                                                                    | `errors`: array of `{ "pointer": "<JSON Pointer>", "message": "<rule>" }`, one per violation. |
| `lab-open`               | 409    | The lab's deadline has not passed, so new submissions could still arrive.                                                    | `closesAt`: ISO 8601 instant after which publishing is possible.                              |
| `reviews-pending`        | 409    | At least one verdict is still waiting in the TA's review queue.                                                              | `pending`: integer > 0; `reviewQueue`: path of the queue to work through.                     |
| `route-not-found`        | 404    | The path does not match any route (for example `POST /labs/{labId}` without `/publish`).                                     | —                                                                                             |
| `internal-error`         | 500    | Unexpected failure. Safe to retry; nothing was published if you get this.                                                    | —                                                                                             |

Example:

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{
  "type": "https://leetkob.dev/problems/reviews-pending",
  "title": "Reviews are still pending",
  "status": 409,
  "detail": "3 verdict(s) are waiting for your review.",
  "instance": "/labs/lab_sorting/publish",
  "pending": 3,
  "reviewQueue": "/labs/lab_sorting/review-queue"
}
```

Precedence: an already-published lab answers `200` even if it would now fail `lab-open` or
`reviews-pending` (nothing can change a published lab). The body is validated _before_ the
idempotent `200`, so a malformed repeat still gets `400`/`422`.

## Idempotency

Publishing is idempotent by resource, not by request: the lab is the idempotency key.

- The first successful call creates the publication and answers `201`.
- Every later call on the same lab answers `200` with the original publication, whoever the
  TA is (as long as they own the lab) and whatever the body says. A different `note` on a
  repeat is ignored, not merged, not rejected: the note students saw must never change silently.
- A client that lost the response to its first call simply calls again; it gets `200` and the
  same `publicationId`. It must not treat `200` as "already published by someone else" and
  stop: both statuses mean "the marks are out".
- Two concurrent first calls: exactly one `201`, the other `200` with the same publication.
  (PA#2's in-memory store serialises requests on one thread; PA#3's database enforces this
  with a unique constraint on `labId`.)
- Retrying after `409` or `5xx` is safe: nothing was published.

There is no `Idempotency-Key` header on this endpoint; sending one is ignored.

## Paging

Not applicable: the response is a single object.

## What happens when it changes

- **Additive changes are not breaking** and keep the path: a new optional request field, a
  new response member, a new extension member on an existing problem type, or a new
  problem type for a situation that previously answered `500`. Clients must ignore members
  they do not know.
- **Breaking changes** get a new path (`/v2/labs/{labId}/publish`) and this file gets a sibling
  `publish-lab.v2.md`. Breaking means: a field removed or renamed, a type or rule tightened,
  a status code changed for an existing problem type, a problem `type` URI changed, or the
  ownership rule loosened. The old path keeps working for one checkpoint (about two weeks)
  and answers with `Deprecation: true` and `Sunset: <HTTP-date>` headers during that time.
- **A problem `type` never changes meaning.** If a situation needs a different meaning, it
  gets a new slug.
- Every change to this file ships in the same pull request as the code and the contract
  tests, and the PR is blocked until `test` is green. `test/contract/contract-doc.test.ts`
  fails when a type listed here is missing from the code or the other way round.

## Decisions this contract relies on

- Admins cannot publish (`403`). The brief says the TA publishes; the product owners' FAQ
  has not said otherwise. If the FAQ changes this, `forbidden-role` for admins becomes `201`
  and that is a loosening, so it stays on version 1.
- A lab must be closed before publishing (`lab-open`). The brief does not say so; we chose it
  so that a submission arriving after publishing cannot be left unmarked.
