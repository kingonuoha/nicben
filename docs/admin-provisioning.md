# Admin provisioning — NICBEN hidden portal

**Applies to:** `web/` — Phase 06, `docs/tasks/phase-06-hidden-admin-portal/`
**Decisions:** `decisions.md` **D-026** (argon2id), **D-028** (fail closed), **D-030** (bootstrap)

This document is the **bootstrap path** the Phase 06 backend task asks for: how an admin
account comes into existence, in development and in production, without any credential
material entering the repository.

---

## 1. The account lives behind the repository port

`AdminUser` is a first-class record in the data model (`docs/06-tech-and-security-spec.md`
§24) and is reached only through the port (`decisions.md` D-019). The concrete collection is
declared in exactly one place:

| Adapter | Where the account comes from |
|---|---|
| `dev` (`MONGODB_URI` absent) | seeded in process memory from `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`, on first credential lookup |
| `mongo` (`MONGODB_URI` set) | the `adminUsers` collection, read by `findAdminByEmail` |

The collection name is exported as `ADMIN_USER_COLLECTION` from
`web/lib/data/adapters/mongo.ts`. Nothing else in the application reads or writes it —
`grep -rn "adminUsers" web/lib web/app` matches the port and the index declaration only.

## 2. Fail-closed behaviour — D-028

**Authorisation consults no environment variable.** The only thing that can authenticate a
login attempt is a stored `AdminUser` whose `passwordHash` verifies
(`web/lib/auth/login.ts`). Consequences:

- With no credential variables **and** no database, there is no admin row, so every login is
  rejected. There is no default password, no fallback account and no development bypass —
  there is nothing to match against.
- With a database and no `adminUsers` document, the same thing is true.
- With `MONGODB_URI` set but unreachable, the lookup fails and the attempt is rejected.
- A half-configured pair (`ADMIN_EMAIL` without `ADMIN_PASSWORD_HASH`, or the reverse)
  seeds nothing.

When neither the credential variables nor a durable store are present, the application logs
`admin_credentials_absent` at `error` level in production and `warn` elsewhere, naming the
consequence. That log line is the only thing that distinguishes "misconfigured" from
"attempted with the wrong password" — and it is server-side only, so it is not an
enumeration oracle.

## 3. Development / local portal

```bash
cd web
node scripts/hash-admin-password.mjs                 # prompts; prints an argon2id hash
# → copy the hash into .env.local as ADMIN_PASSWORD_HASH
# → set ADMIN_EMAIL to the operator's address
# → set ADMIN_SESSION_SECRET to 48 random bytes (optional locally; see §6)
npm run dev
# → http://localhost:3000/admin/login
```

`.env.local` is gitignored (`.gitignore:19-21`). `.env.example` carries placeholders and
comments only — never a value (D-024, `06` §37).

The password policy (`ADMIN_PASSWORD_POLICY` in `web/lib/auth/password.ts`, implemented by
the script) is the `06` §29 alternative that D-029 adopts in place of TOTP: at least 12
characters, at least one digit, at least one non-alphanumeric character, and not a
well-known password.

## 4. Production provisioning — MongoDB Atlas

The account is created **once**, by an operator, with operator-held credentials. The
application has no "create the first admin" endpoint and never will: such an endpoint is a
bootstrapping back door by definition.

### 4.1 Generate the hash

```bash
cd web
node scripts/hash-admin-password.mjs
```

The script prints a `$argon2id$v=19$m=19456,t=2,p=1$…` string. It does not write a file,
does not log the password, and does not connect to any database.

### 4.2 Insert the document

Run this against the Atlas cluster with `mongosh`, from a machine the operator controls.
Replace the two placeholders; do **not** paste the real hash into a shell history file you
do not control, and do not commit the command with a value filled in.

```javascript
// mongosh "mongodb+srv://<cluster-host>/nicben"
use("nicben")

db.adminUsers.insertOne({
  email: "OPERATOR_EMAIL_HERE",              // lower-cased; the port lower-cases on lookup
  passwordHash: "ARGON2ID_HASH_HERE",        // from scripts/hash-admin-password.mjs
  createdAt: new Date().toISOString()        // ISO-8601 string, matching the model
})
```

The document shape is `AdminUser` from `web/lib/data/types.ts` minus the generated `id`:
`{ _id, email, passwordHash, createdAt }`. `_id` is Mongo's `ObjectId`, and it is the
`AdminUser.id` the application sees — the adapter projects `_id` to `id` and never leaks
`_id` across the port.

The unique index is created automatically on first use
(`{ email: 1 }, { unique: true }`, name `email_unique`). If the insert above runs before the
application has ever connected, create it manually so the uniqueness guarantee is not
deferred:

```javascript
db.adminUsers.createIndex({ email: 1 }, { name: "email_unique", unique: true })
```

### 4.3 Verify

```javascript
db.adminUsers.findOne({}, { passwordHash: 0 })   // must return exactly one document
db.adminUsers.countDocuments({})                 // must be 1
```

Then sign in at `/admin/login` over HTTPS and confirm `db.auditLogs` receives a
`login-success` entry with the correct `actorEmail`.

### 4.4 Rotate or replace

Re-run §4.1 and `$set` the new hash:

```javascript
db.adminUsers.updateOne({ email: "OPERATOR_EMAIL_HERE" }, { $set: { passwordHash: "NEW_HASH" } })
```

**Every existing session becomes invalid at the next request.** The session guard re-resolves
the account on every request and compares the signed `sub` with the stored `id`; replacing the
document changes `_id`, so an old token no longer matches. This is the revocation mechanism
D-027 says does not otherwise exist.

To **revoke without rotating the password**, delete and re-insert the document (new `_id`):

```javascript
db.adminUsers.deleteOne({ email: "OPERATOR_EMAIL_HERE" })
```

### 4.5 Removal

```javascript
db.adminUsers.deleteMany({})   // the portal is now unreachable; D-028 applies in full
```

## 5. What is deliberately not provisioned

- **No second admin, and no roles.** The trail records `adminId` and `actorEmail` from the
  session on every action, so adding a second operator later needs no schema change. An
  authorisation model is not defined by the spec and has not been invented (`decisions.md`
  D-008).
- **No self-service password reset.** Resetting requires SMTP to an address the operator
  controls and a token store; neither is specified, and an unauthenticated reset endpoint on
  a hidden portal is a larger risk than an operator running §4.4.
- **No TOTP.** Deferred with the reason recorded in D-029; the spec's stated alternative
  (strong password policy plus rate limiting and lockout) is implemented instead.

## 6. `ADMIN_SESSION_SECRET`

32 or more random bytes, base64 or hex. Generate with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Set it in the hosting provider's environment, separately for staging and production
(`06` §37 requires separate values). It must be **identical across every instance** of a
deployment: sessions signed by one instance are verified by another, and a per-instance
secret would log the operator out on every request that landed elsewhere.

When it is absent the application generates a **per-boot ephemeral** secret and logs
`session_secret_ephemeral` at `error` level in production. There is deliberately no
hardcoded fallback: a literal default in the repository would be a universal forgery key
published alongside the source (D-027).

## 7. Credentials-absent acceptance

The standing contract from Phase 05 (D-019 … D-024) is unchanged and is re-verified for this
phase: **the build, the type-check and the tests pass with zero environment variables set.**
With all three admin variables absent:

- `npm run build`, `npm run type-check`, `npx eslint . --max-warnings 0` → exit 0;
- `/admin/login` renders and every submission is rejected with `401`;
- every admin API returns `401`;
- the dev adapter logs that no admin was seeded, at `warn` (development) or `error`
  (production).
