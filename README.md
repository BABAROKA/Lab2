# Lab 2 — Real-Time Chat Application

### What is extra rather than mandatory

The following improve the project but are **not substitutes for the mandatory course requirements**:

- Redis rate limiting/caching/presence/scaling improvements.
- More detailed audit logging.
- Stronger session rotation/revocation.
- WebRTC voice/video as an optional fourth feature.
- E2EE research/stretch work.
- Automated tests.
- Extra observability and production hardening.

**Rule:** never let an optional feature delay an incomplete mandatory requirement.

## Database

- [x] Initial migration applied with the first six tables present
- [x] All 10 mandatory tables completed exactly to course requirements
- [x] Correct mandatory table names (`refresh_tokens`, `role_permissions`) finalized
- [x] `users` includes course-required `first_name` and `last_name`
- [x] `refresh_tokens` includes `token_hash`, `expires_at`, `revoked_at`, `created_at` and our `jti` session identifier
- [x] Remaining mandatory tables completed
- [x] Full 24+ table schema completed
- [ ] Final ERD completed
- [ ] All required foreign keys reviewed
- [ ] All required indexes reviewed
- [ ] 3NF review completed

## Authentication

- [x] Register input validation designed with Zod
- [x] Login input validation designed with Zod
- [x] JWT claim validation designed with Zod
- [x] Argon2 password hashing utility started
- [x] Access JWT design
- [x] Refresh JWT design
- [x] User repository created
- [x] Auth service started
- [x] Register flow implemented/designed
- [x] Login flow implemented/designed
- [x] HTTP-only cookie design
- [x] `access` authentication middleware started
- [x] Refresh-session repository
- [x] Refresh-token hash storage
- [x] Refresh rotation with DB validation
- [x] Logout session revocation
- [x] Cookie clearing
- [x] Authentication error middleware
- [ ] Role/permission middleware
- [ ] End-to-end auth manual test

## Real-time

- [ ] Socket.IO server attached to HTTP server
- [ ] Socket authentication
- [ ] Conversation rooms
- [ ] Message send/new events
- [ ] Typing events
- [ ] Presence
- [ ] Read receipts
- [ ] Notifications
- [ ] Authorization on every relevant Socket.IO action

## Additional features

- [ ] Advanced Search
- [ ] Data Import/Export
- [ ] Dynamic Reports

## Project management/documentation

- [ ] Git contribution history complete
- [ ] PRs complete
- [ ] Lecturer invited to repository
- [ ] Jira/Trello/GitHub Projects board complete
- [ ] README complete
- [ ] OpenAPI or Postman complete
- [ ] ERD complete
- [ ] Presentation demo prepared
- [ ] Individual-defense notes prepared

---

# 1. Course grading checklist

The supplied document describes the project as **40% of the course grade** and the individual exam as **60%**. Its presentation breakdown then divides the project component across management/documentation, database, backend, frontend, and the three additional features. Treat the percentages in that table as the supplied project-presentation weighting and do not confuse them with the separate 60% individual exam.


## 1.1 Management / documentation

### Git — 5%

- [ ] Every member has meaningful individual commits
- [ ] Commit messages describe the actual change
- [ ] No giant anonymous commits hiding contribution
- [ ] Work is pushed regularly
- [ ] Pull Requests are used where appropriate
- [ ] Pull Requests show meaningful review/contribution
- [ ] Lecturer is invited to the repository:
  - `elton.boshnjaku@ubt-uni.net`
- [ ] Repository is clean before presentation
- [ ] No `.env` secrets committed
- [ ] No generated junk committed unnecessarily

### Project management — 5%

Use one of:

- [ ] Jira
- [ ] Trello
- [ ] GitHub Projects

Board must clearly show:

- [ ] To Do
- [ ] In Progress
- [ ] Done
- [ ] Every task has an owner
- [ ] Every task has a deadline
- [ ] Tasks correspond to real repository work
- [ ] Progress history is believable and maintained

---

# 2. Technology stack checklist

## Backend

- [x] Node.js
- [x] Express.js
- [x] TypeScript
- [x] Drizzle ORM
- [x] PostgreSQL
- [x] Redis
- [x] Socket.IO
- [x] Zod
- [x] Argon2
- [x] JWT
- [x] CORS
- [x] Helmet
- [x] Cookie handling

## Frontend

- [ ] React
- [ ] Vite
- [ ] TypeScript
- [ ] Tailwind
- [ ] Zustand
- [ ] Socket.IO client
- [ ] Lazy loading / code splitting

## Infrastructure

- [x] Docker Compose
- [ ] Production-like environment configuration documented
- [ ] Database migration instructions documented
- [ ] Redis startup instructions documented

---

# 3. Backend architecture

Required architecture:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

## Controllers

- [ ] Controllers handle HTTP concerns only
- [ ] Controllers parse/validate HTTP input
- [ ] Controllers call services
- [ ] Controllers convert service results to HTTP responses
- [ ] Controllers set/clear cookies
- [ ] Controllers do NOT contain business rules
- [ ] Controllers do NOT contain Drizzle queries

## Services

- [ ] Services contain business/application logic
- [ ] Services coordinate repositories
- [ ] Services perform security decisions
- [ ] Services do NOT manipulate Express `Request`/`Response`
- [ ] Services do NOT contain raw SQL
- [ ] Services do NOT own cookie handling

## Repositories

- [x] UserRepository started
- [ ] RefreshTokenRepository
- [ ] ConversationRepository
- [ ] MessageRepository
- [ ] NotificationRepository
- [ ] FileRepository
- [ ] Search repositories/queries where useful
- [ ] Report repositories/queries
- [ ] Import/export persistence

Repositories should isolate Drizzle/database access from business logic.

---

# 4. Database — minimum 24 relational tables

The course requires at least **24 relational tables** and specifically requires these 10:

## 4.1 Mandatory 10 — exact course alignment

### `users`
Required course fields include:

- [ ] `id`
- [ ] `first_name`
- [ ] `last_name`
- [ ] `email`
- [ ] `password_hash`
- [ ] `is_active`
- [ ] `created_at`
- [ ] `updated_at`

Our chat application may additionally use:

- [ ] `uuid` — public identifier
- [ ] `username` — chat identity/handle

### `roles`
- [ ] `id`
- [ ] `name`
- [ ] `description`
- [ ] `created_at`

### `user_roles`
- [ ] `id`
- [ ] `user_id`
- [ ] `role_id`
- [ ] `assigned_at`

### `permissions`
- [ ] `id`
- [ ] `name`
- [ ] `description`

### `role_permissions`
- [ ] `id`
- [ ] `role_id`
- [ ] `permission_id`

### `refresh_tokens`
Course-required fields:

- [ ] `id`
- [ ] `user_id`
- [ ] `token_hash`
- [ ] `expires_at`
- [ ] `revoked_at`
- [ ] `created_at`

Our authentication design additionally uses:

- [ ] `jti` — unique refresh-session identifier
- [ ] `device_name`
- [ ] `user_agent`

### `audit_logs`
- [ ] `id`
- [ ] `user_id`
- [ ] `action`
- [ ] `entity`
- [ ] `entity_id`
- [ ] `old_value`
- [ ] `new_value`
- [ ] `ip_address`
- [ ] `created_at`

### `notifications`
- [ ] `id`
- [ ] `user_id`
- [ ] `type`
- [ ] `title`
- [ ] `message`
- [ ] `is_read`
- [ ] `created_at`

### `settings`
- [ ] `id`
- [ ] `key`
- [ ] `value`
- [ ] `description`
- [ ] `updated_at`

### `files`
- [ ] `id`
- [ ] `entity`
- [ ] `entity_id`
- [ ] `filename`
- [ ] `file_path`
- [ ] `file_size`
- [ ] `uploaded_by`
- [ ] `created_at`

**Important:** the exact field examples above come directly from the supplied course document. Extra fields are allowed where they support the application.

## 4.2 Recommended chat/domain tables

Use the following 14 to reach 24 cleanly:

- [ ] `conversations`
- [ ] `conversation_members`
- [ ] `messages`
- [ ] `message_attachments`
- [ ] `message_reactions`
- [ ] `message_reads`
- [ ] `message_edits`
- [ ] `conversation_invites`
- [ ] `blocked_users`
- [ ] `message_mentions`
- [ ] `import_jobs`
- [ ] `export_jobs`
- [ ] `report_definitions`
- [ ] `report_runs`

That gives exactly **24 tables** when combined with the 10 mandatory tables.

Do not add tables merely to inflate the count. Every table should have a meaningful relationship to the application or one of the required features.

---

# 5. Database quality checklist

- [ ] Final schema is in 3NF where applicable
- [ ] Every FK points to the correct parent
- [ ] FK delete/update behavior is deliberate
- [ ] Required unique constraints exist
- [ ] Required indexes exist
- [ ] Composite uniqueness used where appropriate
- [ ] No redundant indexes without a reason
- [ ] Public entities use UUIDs where appropriate
- [ ] Internal numeric IDs remain internal where useful
- [ ] Timestamps use `timestamptz`/timezone-aware storage
- [ ] Audit columns are present where the course requires them
- [ ] `created_by` / `updated_by` are implemented where applicable
- [ ] No plaintext passwords
- [ ] No plaintext refresh tokens
- [ ] Sensitive data is not unnecessarily duplicated

---

# 6. Refresh-token/session design

Final target design must satisfy the course fields first and then add our session fields:

```text
refresh_tokens
├── id
├── user_id
├── jti
├── token_hash
├── expires_at
├── revoked_at
├── created_at
├── device_name
└── user_agent
```

The course-required lifecycle columns are **not optional**. `revoked_at` gives us explicit session revocation and `expires_at` gives the database its own session-lifecycle record even though the JWT also contains `exp`.

## Rules

- [ ] `jti` is unique
- [ ] `jti` is stored normally; it is an identifier, not the credential
- [ ] Raw refresh JWT is never stored in DB
- [ ] Raw refresh JWT is hashed before persistence
- [ ] Refresh JWT contains `sub`
- [ ] Refresh JWT contains `jti`
- [ ] Refresh JWT contains `iat`
- [ ] Refresh JWT contains `exp`
- [ ] Access JWT contains `sub`
- [ ] Access JWT contains `iat`
- [ ] Access JWT contains `exp`
- [ ] Access token lifetime is much shorter than refresh-token lifetime
- [ ] Multiple devices/sessions are supported
- [ ] Refresh rotation generates a new `jti`
- [ ] Old refresh session is invalidated during rotation
- [ ] Logout invalidates the current refresh session
- [ ] Logout clears cookies

---

# 7. Authentication checklist

## 7.1 Registration

```text
HTTP request
    ↓
Zod
    ↓
AuthService
    ↓
check email
    ↓
check username
    ↓
Argon2id hash
    ↓
UserRepository.create()
    ↓
issue access + refresh
    ↓
store refresh session
    ↓
set HttpOnly cookies
    ↓
return public UUID
```

- [x] Register Zod schema
- [ ] Username validation
- [ ] Email validation
- [ ] Password validation
- [ ] Duplicate email check
- [ ] Duplicate username check
- [ ] Password hashed with Argon2id
- [ ] User created through repository
- [ ] Default role assigned
- [ ] Access token generated
- [ ] Refresh token generated
- [ ] Refresh session stored
- [ ] Both cookies set
- [ ] JSON response contains only intended public data
- [ ] Password hash is never returned

## 7.2 Login

- [x] Login Zod schema
- [ ] Find by email
- [ ] Verify Argon2 password
- [ ] Generic invalid-credentials response
- [ ] Access token generated
- [ ] Refresh token generated
- [ ] Refresh session stored
- [ ] Both cookies set
- [ ] UUID returned
- [ ] Password hash never returned
- [ ] Login success audit entry
- [ ] Login failure audit entry / safe logging

## 7.3 Access middleware

Target flow:

```text
access cookie
    ↓
valid?
    ├── yes → req.auth.uuid → next()
    └── no
         ↓
     refresh cookie
         ↓
     valid JWT?
         ↓
     valid DB session?
         ↓
     valid token hash?
         ↓
     rotate BOTH tokens
         ↓
     set cookies
         ↓
     req.auth.uuid
         ↓
     next()
```

- [x] Middleware exists
- [ ] Access cookie read safely
- [x] Access JWT signature verified
- [x] Access JWT expiration enforced
- [x] Access claims validated by Zod
- [ ] `req.auth.uuid` attached
- [ ] `next()` called only after authentication succeeds
- [ ] Invalid/missing auth ends with 401
- [ ] Expired access token falls back to refresh
- [ ] Refresh JWT verified
- [ ] Refresh `jti` checked in DB
- [ ] Stored hash checked
- [ ] Refresh session rotated
- [ ] New cookies written
- [ ] Request continues after successful refresh

## 7.4 Explicit refresh functionality

No public `/auth/refresh` endpoint is required by the current architecture.

The server still needs an internal refresh/rotation operation because `access` can invoke it when the access token expires.

- [ ] `AuthService` refresh/rotation operation exists
- [ ] It accepts the refresh token/session information
- [ ] It verifies refresh claims
- [ ] It loads the session by `jti`
- [ ] It validates the refresh-token hash
- [ ] It rotates the session
- [ ] It generates a new access token
- [ ] It generates a new refresh token
- [ ] It returns both tokens + UUID to its caller
- [ ] Controller/middleware owns cookie writing

## 7.5 Logout

- [ ] Read refresh cookie
- [ ] Identify session by verified `jti`
- [ ] Revoke/delete the session row
- [ ] Clear access cookie
- [ ] Clear refresh cookie
- [ ] Return success even when there is nothing useful to revoke
- [ ] Audit logout

## 7.6 Authorization

- [ ] Roles exist
- [ ] Permissions exist
- [ ] User-to-role relationship works
- [ ] Role-to-permission relationship works
- [ ] Role middleware exists
- [ ] Permission checks exist where necessary
- [ ] Forbidden requests return 403
- [ ] Authentication failures return 401
- [ ] No endpoint relies only on frontend authorization

---

# 8. Security checklist

- [ ] Argon2id for passwords
- [ ] No plaintext password storage
- [ ] No plaintext refresh-token storage
- [ ] HttpOnly authentication cookies
- [ ] Secure cookies in production
- [ ] Appropriate SameSite configuration
- [ ] CORS is allowlisted, not `*` with credentials
- [ ] HTTPS documented for production
- [ ] No secrets in source control
- [ ] Environment variables validated with Zod
- [ ] Helmet enabled
- [ ] JSON/body size limits configured
- [ ] Authentication rate limiting using Redis
- [ ] Login abuse protections considered
- [ ] Generic login errors to avoid account enumeration
- [ ] Password reset/change rules require re-authentication where appropriate
- [ ] CSRF strategy documented for cookie-authenticated state-changing requests
- [ ] File upload size/type validation
- [ ] File names are not trusted as storage paths
- [ ] SQL injection prevented through Drizzle/parameterized queries
- [ ] Error responses do not expose stack traces
- [ ] Internal secrets never appear in logs
- [ ] Audit logs record important security events

> OWASP currently recommends strong password hashing such as Argon2id and emphasizes secure session management, TLS for authenticated sessions, secure cookie handling, and not storing authentication tokens in browser local/session storage.

---

# 9. Error handling

Create one central error middleware.

- [ ] `error.middleware.ts`
- [ ] Zod errors mapped to a client-safe validation response
- [ ] Authentication errors mapped to 401
- [ ] Authorization errors mapped to 403
- [ ] Conflict/unique violations mapped appropriately
- [ ] Not-found errors mapped to 404
- [ ] Unexpected errors mapped to 500
- [ ] Production responses don't expose stack traces
- [ ] Errors have consistent JSON shape
- [ ] Logging is separated from response formatting

Recommended response shape:

```json
{
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

Keep error codes stable even if messages change.

---

# 10. Users / profiles

- [ ] Get own profile
- [ ] Update profile
- [ ] Change username
- [ ] Change email with appropriate security controls
- [ ] Change password with current-password verification
- [ ] Deactivate account
- [ ] Search users
- [ ] Block user
- [ ] Unblock user
- [ ] Respect blocked-user relationships in messaging/search
- [ ] Public/user-facing data never includes `password_hash`

Repository operations should remain persistence operations; user/auth services should own rules.

---

# 11. Conversations

- [ ] Direct conversations
- [ ] Group conversations if kept in scope
- [ ] Create conversation
- [ ] Add member
- [ ] Remove member
- [ ] Leave conversation
- [ ] Conversation ownership/admin role
- [ ] Membership authorization
- [ ] Conversation listing
- [ ] Pagination
- [ ] Last-message metadata
- [ ] Unread counts
- [ ] Conversation search

---

# 12. Messages

- [ ] Send message
- [ ] Persist message
- [ ] Fetch message history
- [ ] Pagination/infinite scroll
- [ ] Edit message
- [ ] Delete message according to chosen semantics
- [ ] Reply/quote if included
- [ ] Reactions
- [ ] Mentions
- [ ] Attachments
- [ ] Read receipts
- [ ] Message search
- [ ] Message authorization
- [ ] Sender ownership checks
- [ ] Optional client message ID for deduplication/idempotency

---

# 13. Socket.IO / real-time checklist

Real-time communication is mandatory and polling does **not** count.

## Server setup

- [ ] Socket.IO attached to the HTTP server
- [ ] Socket connection authentication
- [ ] Authenticated socket gets user UUID
- [ ] Connection denied when authentication fails
- [ ] Socket authorization is separate from frontend UI authorization

## Rooms

- [ ] One room per conversation
- [ ] Server verifies membership before joining
- [ ] Server verifies membership before sending

Suggested room naming:

```text
conversation:<conversationUuid>
```

## Events

### Messages

- [ ] `message:send`
- [ ] `message:new`

### Typing

- [ ] `typing:start`
- [ ] `typing:stop`

### Presence

- [ ] `user:online`
- [ ] `user:offline`

### Read state

- [ ] `message:read`

### Notifications

- [ ] `notification:new`

## Real-time quality

- [ ] Server validates every event payload
- [ ] Server checks authorization for every event
- [ ] Errors use Socket.IO error acknowledgements/events consistently
- [ ] Duplicate messages handled safely
- [ ] Reconnect behavior tested
- [ ] Presence survives multiple tabs where intended
- [ ] Offline state handled correctly
- [ ] Message persistence happens before or with a well-defined emit strategy

---

# 14. Redis integration

The course awards a dedicated NoSQL-integration score, so Redis must be **used meaningfully and demonstrated**, not merely installed.

## Presence

- [ ] User online state stored in Redis
- [ ] Multiple sockets per user handled
- [ ] Disconnect updates state correctly
- [ ] TTL/cleanup strategy prevents stale presence

## Rate limiting

- [ ] Login rate limit
- [ ] Register abuse limit
- [ ] Sensitive endpoint limits
- [ ] Limits are documented

## Caching

- [ ] At least one meaningful cache use exists
- [ ] Cache TTL chosen deliberately
- [ ] Cache invalidation documented
- [ ] Cache misses fall back safely to PostgreSQL

## Socket.IO scaling

Optional unless multiple backend instances are actually deployed:

- [ ] Redis Socket.IO adapter added
- [ ] Multi-instance event propagation tested

Do not add a distributed architecture merely for appearance if the project only runs one backend instance.

---

# 15. Frontend checklist

## React/Vite foundation

- [ ] React routes
- [ ] Login page
- [ ] Register page
- [ ] Chat layout
- [ ] Conversation list
- [ ] Message view
- [ ] User/profile area
- [ ] Notifications
- [ ] Settings
- [ ] Error states
- [ ] Loading states
- [ ] Empty states
- [ ] Responsive layout

## Zustand

- [ ] Auth/user state
- [ ] Conversation state
- [ ] Message state
- [ ] Presence state
- [ ] Notification state
- [ ] Store boundaries are sensible
- [ ] No giant global store containing everything

Important:

- [ ] Do NOT store JWTs in `localStorage`
- [ ] Browser authentication state relies on HttpOnly cookies
- [ ] On app startup, call authenticated endpoint such as `/users/me`
- [ ] If access expires, backend middleware performs refresh
- [ ] A 401 clears the frontend authenticated state

## Real-time UI

- [ ] Socket connects only after authentication
- [ ] New messages appear without polling
- [ ] Typing indicator works
- [ ] Presence works
- [ ] Read receipts work
- [ ] Notifications work
- [ ] Reconnect behavior works
- [ ] Optimistic messages handle failure correctly

## Optimization

- [ ] Lazy-load major pages
- [ ] Code splitting demonstrated
- [ ] Avoid unnecessary rerenders
- [ ] Paginate/infinite-scroll long message histories
- [ ] Avoid loading the entire message history at once

---

# 15.5 Additional-feature compliance rule

The course requires **at least 3 features from its official list**. Our chosen three are:

- [ ] **Advanced Search** — Feature option #1
- [ ] **Data Importing/Exporting** — Feature option #4
- [ ] **Dynamic Report Generation** — Feature option #5

Not selected as one of the required three:

- [ ] CMS
- [ ] Online Payments
- [ ] Microservices Architecture
- [ ] Machine Learning Integration
- [ ] WebRTC Communication
- [ ] CQRS

WebRTC remains a recommended **optional fourth feature** because it fits a chat application particularly well and is explicitly named by the course. E2EE is not a course feature option and therefore remains a stretch-goal security project, not a replacement for one of the three graded additional features.

# 16. Advanced Search — additional feature #1

Search must cover at least five lists.

Recommended lists:

- [ ] Users
- [ ] Conversations
- [ ] Messages
- [ ] Notifications
- [ ] Audit logs

## Requirements

- [ ] Search across 5+ lists
- [ ] Per-list filters
- [ ] Pagination
- [ ] Sorting
- [ ] Clear empty-state behavior
- [ ] Authorization-aware results
- [ ] Search cannot leak private conversations/messages
- [ ] Search query validation with Zod
- [ ] Appropriate PostgreSQL indexes
- [ ] Search behavior documented

Start with PostgreSQL-native search (`ILIKE`, full-text search, trigram indexes where useful) before introducing Elasticsearch or another search engine.

---

# 17. Data Import / Export — additional feature #2

The feature must cover at least five lists and support:

- [ ] CSV
- [ ] Excel/XLSX
- [ ] JSON

Recommended datasets:

- [ ] Users
- [ ] Conversations
- [ ] Messages
- [ ] Notifications
- [ ] Settings

## Import

- [ ] Upload validation
- [ ] File-type validation
- [ ] File-size limit
- [ ] Schema validation per row
- [ ] Error report for invalid rows
- [ ] Transaction strategy documented
- [ ] Foreign-key dependency order documented
- [ ] Duplicate handling defined
- [ ] Permission checks
- [ ] Audit log generated

## Export

- [ ] Export authorization
- [ ] Stable column definitions
- [ ] Correct UTF-8 handling
- [ ] CSV export
- [ ] XLSX export
- [ ] JSON export
- [ ] Audit log generated

For large exports/imports:

- [ ] Background execution considered
- [ ] `import_jobs` / `export_jobs` status stored
- [ ] Progress state exposed to user
- [ ] Failures recorded

---

# 18. Dynamic Reports — additional feature #3

- [ ] Report definition model
- [ ] Report execution model
- [ ] User-selectable filters
- [ ] Date filters
- [ ] User filters
- [ ] Conversation filters
- [ ] Message/activity criteria
- [ ] Aggregations
- [ ] Sorting
- [ ] Pagination where needed
- [ ] Authorization-aware reports
- [ ] Report history/run tracking
- [ ] Export report result

At least several meaningful report examples should exist, such as:

- [ ] Message volume over time
- [ ] Active users
- [ ] Conversation activity
- [ ] Notification delivery/activity
- [ ] User activity summary

The important part is that the user can **change criteria**, not merely click five hard-coded reports.

---

# 19. Files / attachments

- [ ] Files table used meaningfully
- [ ] Upload endpoint
- [ ] Download endpoint
- [ ] Authorization checks
- [ ] File metadata stored
- [ ] File type validation
- [ ] Size limits
- [ ] Safe storage naming
- [ ] Message attachment relationship
- [ ] Delete/cleanup strategy

Do not trust client-supplied MIME type alone.

---

# 20. Notifications

- [ ] Notification table
- [ ] Notification service
- [ ] Read/unread state
- [ ] Real-time delivery
- [ ] Notification history
- [ ] Notification authorization
- [ ] Frontend notification store

---

# 21. Audit logs

Mandatory table should be meaningful, not empty.

Log important events such as:

- [ ] Login success
- [ ] Login failure
- [ ] Logout
- [ ] Role changes
- [ ] Permission changes
- [ ] Account changes
- [ ] Message deletion/edit if appropriate
- [ ] Imports
- [ ] Exports
- [ ] Sensitive settings changes

For each audit event decide:

- [ ] actor
- [ ] action
- [ ] target/resource
- [ ] timestamp
- [ ] metadata
- [ ] success/failure

Never store passwords or raw authentication tokens in audit logs.

---

# 22. OpenAPI / Postman documentation

Choose one required documentation path:

- [ ] Swagger/OpenAPI
**OR**
- [ ] Postman Collection

Document at least:

## Auth

- [ ] Register
- [ ] Login
- [ ] Logout

## Users

- [ ] Get current user
- [ ] Update user
- [ ] Search users
- [ ] Block/unblock if implemented

## Conversations

- [ ] Create
- [ ] List
- [ ] Get
- [ ] Update
- [ ] Members

## Messages

- [ ] Send
- [ ] List history
- [ ] Edit
- [ ] Delete
- [ ] Search
- [ ] Read state

## Notifications

- [ ] List
- [ ] Mark read

## Files

- [ ] Upload
- [ ] Download

## Additional features

- [ ] Search
- [ ] Import
- [ ] Export
- [ ] Reports

For every endpoint document:

- [ ] method
- [ ] path
- [ ] auth requirement
- [ ] request body/query/params
- [ ] validation constraints
- [ ] success response
- [ ] error responses

---

# 23. ERD checklist

- [ ] All 24+ tables present
- [ ] Every relationship represented
- [ ] PKs shown
- [ ] FKs shown
- [ ] Cardinalities understandable
- [ ] Join tables clearly represented
- [ ] No orphan tables
- [ ] ERD matches actual Drizzle schema
- [ ] ERD matches migrated PostgreSQL schema
- [ ] README links/displays the ERD

The ERD must be updated after schema changes, not drawn once and forgotten.

---

# 24. Environment / deployment checklist

## `.env`

- [ ] `PORT`
- [ ] `DATABASE_URL`
- [ ] `REDIS_URL`
- [ ] `CORS_ORIGIN`
- [ ] `JWT_ACCESS_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] Any other production-sensitive configuration

## `.env.example`

- [ ] Every required environment variable listed
- [ ] No real secrets
- [ ] Safe example values

## Startup

- [ ] PostgreSQL startup documented
- [ ] Redis startup documented
- [ ] Migration command documented
- [ ] Dev command documented
- [ ] Build command documented
- [ ] Production start command documented

---

# 25. Suggested backend structure

```text
backend/
├── .env
├── .env.example
├── drizzle/
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── src/
    ├── config/
    │   └── env.ts
    │
    ├── db/
    │   ├── client.ts
    │   ├── redis.ts
    │   └── schema/
    │       ├── users.ts
    │       ├── roles.ts
    │       ├── permissions.ts
    │       ├── refresh-tokens.ts
    │       ├── conversations.ts
    │       ├── messages.ts
    │       └── index.ts
    │
    ├── middleware/
    │   ├── auth.middleware.ts
    │   ├── role.middleware.ts
    │   ├── error.middleware.ts
    │   └── rate-limit.middleware.ts
    │
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── auth.schemas.ts
    │   │   ├── auth.routes.ts
    │   │   └── auth.cookies.ts
    │   │
    │   ├── users/
    │   │   ├── user.controller.ts
    │   │   ├── user.repository.ts
    │   │   ├── user.routes.ts
    │   │   └── user.types.ts
    │   │
    │   ├── conversations/
    │   ├── messages/
    │   ├── notifications/
    │   ├── files/
    │   ├── search/
    │   ├── imports/
    │   ├── exports/
    │   └── reports/
    │
    ├── utils/
    │   ├── auth.ts
    │   └── jwt.ts
    │
    ├── websocket/
    │   ├── socket.ts
    │   ├── auth.ts
    │   └── events/
    │
    ├── types/
    │   └── express.d.ts
    │
    ├── app.ts
    └── server.ts
```

Do not create empty files just to match this tree. Add modules when their feature actually exists.

---

# 26. TypeScript rules

- [ ] `strict: true`
- [ ] `noImplicitAny: true`
- [ ] `noUncheckedIndexedAccess: true`
- [ ] `exactOptionalPropertyTypes: true`
- [ ] No `any` unless there is a documented, unavoidable library boundary
- [ ] Prefer `unknown` over `any` for genuinely unknown external data
- [ ] Use `import type` for type-only imports
- [ ] ESM `.js` import paths maintained
- [ ] No unsafe type assertions just to silence errors
- [ ] Runtime validation with Zod at external boundaries
- [ ] Drizzle-derived types for DB rows where appropriate
- [ ] Separate API/input types from DB persistence types

Key rule:

```text
External input/output
    → Zod schemas + z.infer

Database rows
    → Drizzle inferred types

Business/application data
    → explicit types only when useful
```

---

# 27. Testing / verification checklist

Automated tests are not explicitly listed as a mandatory course requirement in the supplied course document, so do not build a giant test framework before completing required functionality.

Still, perform at least systematic manual verification for every feature.

## Authentication manual matrix

- [ ] Register valid user
- [ ] Register duplicate email
- [ ] Register duplicate username
- [ ] Register invalid email
- [ ] Register invalid password
- [ ] Login valid credentials
- [ ] Login wrong password
- [ ] Login unknown email
- [ ] Access protected route with no cookies
- [ ] Access protected route with valid access cookie
- [ ] Access protected route with expired access + valid refresh
- [ ] Access protected route with invalid refresh
- [ ] Access protected route with revoked refresh session
- [ ] Logout
- [ ] Reuse revoked refresh token fails
- [ ] Two devices can have two sessions
- [ ] Logging out one device does not unintentionally revoke all devices

## Real-time manual matrix

- [ ] Two clients receive a new message instantly
- [ ] Non-member cannot join private conversation room
- [ ] Non-member cannot send message
- [ ] Typing appears/disappears
- [ ] Presence changes
- [ ] Read receipt propagates
- [ ] Notification arrives
- [ ] Reconnect works

## Import/export

- [ ] Valid CSV
- [ ] Invalid CSV
- [ ] Valid XLSX
- [ ] Invalid XLSX
- [ ] Valid JSON
- [ ] Invalid JSON
- [ ] Duplicate handling
- [ ] FK errors
- [ ] Unauthorized import/export
- [ ] Large input behavior

## Reports

- [ ] Empty result
- [ ] Small result
- [ ] Different filters change result
- [ ] Unauthorized report blocked
- [ ] Report history recorded

---

# 28. Presentation/demo checklist

The live demo should prove the project rather than merely show screenshots.

Suggested sequence:

1. [ ] Start services
2. [ ] Show frontend
3. [ ] Register user
4. [ ] Login
5. [ ] Show HttpOnly cookie behavior
6. [ ] Open protected `/users/me`
7. [ ] Demonstrate access-token expiration + automatic refresh
8. [ ] Show refresh session in DB
9. [ ] Send a message between two users
10. [ ] Show Socket.IO delivery with no polling
11. [ ] Show typing indicator
12. [ ] Show presence
13. [ ] Show read receipt
14. [ ] Show notification
15. [ ] Show search
16. [ ] Show import/export
17. [ ] Show a dynamic report
18. [ ] Show ERD
19. [ ] Show project board
20. [ ] Show Git commits/PRs
21. [ ] Show API documentation

---

# 29. Individual exam / defense checklist

Every team member must be able to explain the selected stack and the code they worked on.

Be able to explain:

## Node / Express

- [ ] Request/response lifecycle
- [ ] Middleware
- [ ] Router
- [ ] Controller
- [ ] Error middleware
- [ ] Cookies
- [ ] CORS

## TypeScript

- [ ] `unknown` vs `any`
- [ ] async/await
- [ ] Promise types
- [ ] classes
- [ ] interfaces/types
- [ ] type-only imports
- [ ] declaration merging

## Zod

- [ ] Runtime validation
- [ ] `parse()` vs `safeParse()`
- [ ] `z.infer`
- [ ] Why compile-time types alone do not validate HTTP input

## PostgreSQL / Drizzle

- [ ] PK/FK
- [ ] unique constraints
- [ ] composite uniqueness
- [ ] indexes
- [ ] normalization / 3NF
- [ ] migrations
- [ ] transactions
- [ ] why repositories exist

## Authentication

- [ ] Hashing vs encryption
- [ ] Argon2id
- [ ] JWT signing
- [ ] JWT verification
- [ ] `sub`
- [ ] `iat`
- [ ] `exp`
- [ ] `jti`
- [ ] access vs refresh token
- [ ] refresh rotation
- [ ] cookie security
- [ ] 401 vs 403
- [ ] authentication vs authorization

## Redis

- [ ] cache
- [ ] TTL
- [ ] rate limiting
- [ ] presence
- [ ] why Redis is appropriate for ephemeral state

## Socket.IO

- [ ] WebSocket vs polling
- [ ] rooms
- [ ] events
- [ ] acknowledgements
- [ ] connection authentication
- [ ] authorization
- [ ] reconnection

## Frontend

- [ ] Zustand
- [ ] React state
- [ ] lazy loading
- [ ] code splitting
- [ ] Socket.IO client
- [ ] cookie-based auth flow

## Additional features

- [ ] Search design
- [ ] Import/export design
- [ ] Report generation

---

# 30. High-value optional improvements

These are **not allowed to delay mandatory requirements**.

## A. WebRTC voice/video calls — recommended stretch feature

This is the most natural high-impact optional addition for a chat application.

Possible scope:

- [ ] 1-to-1 voice call
- [ ] 1-to-1 video call
- [ ] Call start/end events through Socket.IO signaling
- [ ] Offer/answer exchange
- [ ] ICE candidate exchange
- [ ] Call authorization
- [ ] Call UI
- [ ] Mute/unmute
- [ ] Camera on/off

WebRTC is designed for peer-to-peer real-time audio/video/data, while a signaling channel is still needed to exchange negotiation information; Socket.IO can naturally provide that signaling layer. [MDN WebRTC API]

This is preferable as a stretch feature to prematurely building a custom cryptographic messaging protocol because it is directly relevant to the chat product and demonstrates another major real-time technology.

## B. End-to-end encryption — optional, not core

Do **not** invent a cryptographic protocol.

A serious E2EE implementation requires much more than putting AES around message text; it involves key establishment, identity/key management, rotation, multi-device behavior, recovery, and careful handling of compromise.

For this course project:

- [ ] Keep transport security with HTTPS/WSS
- [ ] Keep server-side authorization and secure sessions
- [ ] Do not claim the chat is E2EE unless it actually is
- [ ] If E2EE becomes a stretch goal, use a mature, audited protocol/library rather than custom crypto
- [ ] Do not let E2EE delay the required 24+ tables, real-time features, and three additional features

## C. Search quality improvement

- [ ] PostgreSQL full-text search
- [ ] PostgreSQL trigram indexes where justified
- [ ] Ranking/relevance
- [ ] Highlighting

Do not introduce a separate search engine unless scale actually requires it.

## D. Better observability

- [ ] Structured logs
- [ ] Request IDs
- [ ] Authentication audit events
- [ ] Socket connection events
- [ ] Import/export job logs
- [ ] Error correlation

---

# 31. Things NOT to over-engineer

Do **not** build these merely to make the project sound advanced:

- [ ] Microservices unless they genuinely improve a required feature
- [ ] CQRS unless there is a clear read/write separation worth demonstrating
- [ ] Elasticsearch before PostgreSQL search is insufficient
- [ ] A custom encryption protocol
- [ ] A large automated-test platform before mandatory functionality
- [ ] Kubernetes
- [ ] Multiple backend instances without a real deployment need
- [ ] A custom queue system when the project can run synchronously

The goal is a system that is **complete, explainable, secure, and demonstrably working**.

---

# 32. Final "10/10 readiness" gate

Do not consider the project finished until every box below is checked.

## Course requirements

- [ ] 24+ relational tables
- [ ] All 10 mandatory tables
- [ ] PostgreSQL used meaningfully
- [ ] Redis used meaningfully
- [ ] Layered architecture
- [ ] Authentication
- [ ] Authorization
- [ ] Security requirements
- [ ] Real-time communication
- [ ] Socket.IO/native WS with no polling
- [ ] React frontend
- [ ] Zustand
- [ ] Lazy loading/code splitting
- [ ] Three additional features
- [ ] Git contribution history
- [ ] PRs
- [ ] Project board
- [ ] README
- [ ] Swagger/OpenAPI or Postman
- [ ] Accurate ERD
- [ ] Lecturer repository invitation

## Product completeness

- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] Automatic refresh through protected-request middleware
- [ ] Refresh sessions stored in DB
- [ ] Password hashing
- [ ] Role/permission authorization
- [ ] User management
- [ ] Conversations
- [ ] Messages
- [ ] Message history
- [ ] Presence
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Notifications
- [ ] Search
- [ ] Import/export
- [ ] Reports

## Security completeness

- [ ] No plaintext passwords
- [ ] No plaintext refresh tokens
- [ ] No auth tokens in localStorage
- [ ] HttpOnly cookies
- [ ] Secure production cookies
- [ ] Correct SameSite strategy
- [ ] Correct CORS credentials strategy
- [ ] HTTPS/WSS in production
- [ ] Rate limiting
- [ ] Input validation
- [ ] Central error handling
- [ ] Audit logging
- [ ] CSRF strategy
- [ ] Authorization on HTTP routes
- [ ] Authorization on Socket.IO events

## Demonstration completeness

- [ ] Backend starts from clean checkout
- [ ] Frontend starts from clean checkout
- [ ] Docker services start from clean checkout
- [ ] Migrations work from clean DB
- [ ] Seed/demo data works
- [ ] Two clients can chat live
- [ ] Auth works end-to-end
- [ ] Refresh works end-to-end
- [ ] Logout really revokes the session
- [ ] Search demo works
- [ ] Import/export demo works
- [ ] Reports demo works
- [ ] Documentation matches implementation
- [ ] ERD matches database
- [ ] Project board matches repository history

---

# 33. Recommended implementation order from here

Follow this order rather than jumping between unrelated features:

```text
1. Finish auth controller/routes
2. Finish protected /users/me route
3. Finish RefreshTokenRepository
4. Add refresh-session persistence + rotation
5. Finish logout
6. Finish central error middleware
7. Finish role/permission middleware
8. Finish users/profile endpoints
9. Build conversations
10. Build messages + message history
11. Add Socket.IO authentication
12. Add conversation rooms
13. Add message events
14. Add typing/presence/read receipts/notifications
15. Complete Redis presence/rate-limit/cache use
16. Complete all 24 tables
17. Advanced Search
18. Import/Export
19. Dynamic Reports
20. Finish frontend integration
21. ERD + API docs + README
22. Git/PR/project-board cleanup
23. Full manual verification
24. Presentation rehearsal
25. Optional WebRTC stretch
26. Optional E2EE research/stretch only after everything above
```

---

# 34. Definition of done

A feature is **not done** merely because its code exists.

For every feature:

- [ ] Requirement understood
- [ ] Data model designed
- [ ] Zod boundary defined
- [ ] Repository implemented
- [ ] Service logic implemented
- [ ] Controller implemented
- [ ] Route wired
- [ ] Authorization added
- [ ] Error handling added
- [ ] Manual request tested
- [ ] Frontend integrated where needed
- [ ] Documentation updated
- [ ] ERD updated if schema changed
- [ ] Git commit made
- [ ] Project board updated

The project is finished only when the **code, database, documentation, Git history, project board, and live demonstration all agree with each other**.
