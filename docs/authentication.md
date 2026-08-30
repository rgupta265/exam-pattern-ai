# Authentication Architecture — ExamPattern AI

## 1. Authentication Strategy
* **Session Storage:** Signed JWT tokens stored in HTTP-Only, Secure, SameSite=Lax cookies (`exampattern_session`).
* **Password Hashing:** `bcryptjs` with salt round factor of 10.
* **Token Engine:** `jose` library (edge and middleware compatible).
* **Token Lifespan:** 7 days (configurable via `AUTH_EXPIRES_IN`).

---

## 2. Session Lifecycle

```
[Candidate / Admin]
       │ (1. POST /api/auth/login with Email & Password)
       ▼
[AuthService.login()]
       │ (2. Password hash verified via bcrypt)
       ▼
[signToken(payload)]
       │ (3. JWT signed with HMAC-SHA256)
       ▼
[HTTP-Only Cookie Set] ──► Redirect to /candidate/dashboard or /admin/dashboard
```

---

## 3. Server Verification Helper
Use `getServerSession()` in Server Components, Route Handlers, and Server Actions:
```typescript
import { getServerSession } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  // session.id, session.roles, session.permissions available
}
```
