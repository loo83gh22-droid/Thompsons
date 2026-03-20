# FamilyNest Dependency & Supply Chain Findings

Last audited: 2026-03-20

---

## Scale Context

676 audited packages. 3 vulnerabilities found at audit open — 0 remaining after fixes applied today.

---

## Vulnerability Findings (V#)

### V1 — Next.js 16.1.6: 4 CVEs including null-origin CSRF bypass on Server Actions ✅ FIXED (2026-03-20)
**Package:** `next@16.1.6` upgraded to `next@16.2.0`
**Scope:** Production dependency

| Advisory | Severity | Description |
|---|---|---|
| GHSA-mq59-m269-xvcx | Moderate | **Null origin bypasses Server Actions CSRF checks** — a request with `Origin: null` (e.g. from an `<iframe sandbox>` or `data:` URI) skips the origin validation Next.js applies to Server Action POSTs. FamilyNest has 40+ Server Action files; this was the highest-priority fix. |
| GHSA-ggv3-7p47-pfv8 | Moderate | HTTP request smuggling via Next.js rewrites. No rewrites are configured in this app but patching removes the risk entirely. |
| GHSA-3x4c-7xq6-9pq8 | Moderate | Unbounded next/image disk cache growth — crafted `/_next/image` requests can exhaust filesystem. Low risk on Vercel (ephemeral), but a valid DoS vector. |
| GHSA-h27x-g6w4-24gq | Moderate | Unbounded postponed-resume buffering DoS — exploitable via Suspense streaming responses. |

**Fix:** `npm install next@16.2.0 --save-exact`. Also bumped `eslint-config-next` and `@next/third-parties` to `16.2.0` to stay in sync.
**Upgrade complexity:** Low — patch bump, no breaking changes.

---

### V2 — flatted <=3.4.1: DoS and Prototype Pollution ✅ FIXED (2026-03-20)
**Package:** `flatted@3.3.3` upgraded to `flatted@3.4.2` via `npm audit fix`
**Scope:** devDependency only — `@vitest/ui` and `eslint` → never in production bundle

| Advisory | Severity | Description |
|---|---|---|
| GHSA-25h7-pfq9-p65f | High | Unbounded recursion in `parse()` revive phase — crafted input can trigger stack overflow |
| GHSA-rf6f-7fwh-wjgh | High | Prototype Pollution via `parse()` — crafted input pollutes `Object.prototype` |

**Risk:** Low. `flatted.parse()` is only invoked by ESLint's file cache and Vitest's UI — never by production code. Attack would require a malicious file in the project repo.
**Fix:** `npm audit fix`

---

### V3 — undici 7.0.0–7.23.0: 6 CVEs including WebSocket DoS ✅ FIXED (2026-03-20)
**Package:** `undici@7.22.0` upgraded to `undici@7.24.5` via `npm audit fix`
**Scope:** devDependency only — `jsdom` (Vitest test environment) → never in production bundle

| Advisory | Severity | Description |
|---|---|---|
| GHSA-f269-vfmq-vjvj | High | Malicious WebSocket 64-bit frame length causes integer overflow and parser crash |
| GHSA-vrm6-8vpv-qv8q | High | WebSocket permessage-deflate: no decompression size limit → unbounded memory |
| GHSA-phc3-fgpg-7m6h | High | DeduplicationHandler buffers entire response with no limit → memory DoS |
| GHSA-2mjp-6q6p-2qxm | Moderate | HTTP request/response smuggling |
| GHSA-v9p9-hfj2-hcw8 | Moderate | Unhandled exception via invalid `server_max_window_bits` in WebSocket handshake |
| GHSA-4992-7rv2-5pvq | Moderate | CRLF injection via `upgrade` option |

**Risk:** Low. `jsdom`/`undici` is only used by Vitest when running tests. No production code path uses undici directly. Tests don't make WebSocket connections to untrusted servers.
**Fix:** `npm audit fix`

---

## Version Health Findings (H#)

### H1 — `openai` 5 minor versions behind (Low, no CVE)
**Installed:** `^6.27.0` · **Latest:** `6.32.0`
**Gap:** 5 releases behind on the same major. No CVEs in 6.x. Used server-side only for AI suggestions.
**Action:** `npm install openai@latest` when convenient. Low urgency.

### H2 — `lucide-react` 14 releases behind (Low, no CVE)
**Installed:** `^0.563.0` · **Latest:** `0.577.0`
**Gap:** 14 icon-pack releases — purely additive new icons. No security surface.
**Action:** `npm install lucide-react@latest` — cosmetic update to get any new icons added in future.

---

## Supply Chain Assessment

**Package pinning:** `next`, `react`, `react-dom` are exact-pinned (no `^`) — correct for stability. All other production deps use `^` (patch+minor allowed) — acceptable standard practice. No `*`, `>`, or `>=` loose ranges found — clean.

**Lockfile:** `package-lock.json` (lockfileVersion 3) is committed. All 676 packages are tracked at exact resolved versions with SHA-512 integrity hashes. Reproducible installs confirmed.

**Low-download packages:** All direct dependencies are maintained by major organisations (Vercel, Supabase, Stripe, Upstash, Meta/React, OpenAI). No packages with < 1,000 weekly downloads found among direct deps.

**Known supply chain incidents:** No known malicious-code incidents or suspicious ownership transfers detected in any package listed in `package.json` as of audit date.

---

## Confirmed Current & Secure

| Package | Installed | Latest | Status |
|---|---|---|---|
| `next` | 16.2.0 | 16.2.0 | ✅ Current (upgraded today) |
| `react` / `react-dom` | 19.2.4 | 19.2.4 | ✅ Current |
| `@supabase/supabase-js` | ^2.98.0 | 2.99.3 | ✅ 1 minor behind, no CVEs |
| `@supabase/ssr` | ^0.9.0 | 0.9.0 | ✅ Current |
| `stripe` | ^20.4.0 | 20.4.1 | ✅ 1 patch behind, no CVEs |
| `resend` | ^6.9.3 | 6.9.4 | ✅ 1 patch behind, no CVEs |
| `@upstash/redis` | ^1.36.3 | 1.37.0 | ✅ 1 minor behind, no CVEs |
| `@upstash/ratelimit` | ^2.0.8 | 2.0.8 | ✅ Current |
| `zod` | ^4.3.6 | 4.3.6 | ✅ Current |
| `jszip` | ^3.10.1 | 3.10.1 | ✅ Current |
| `date-fns` | ^4.1.0 | 4.1.0 | ✅ Current |
| `react-markdown` | ^10.1.0 | 10.1.0 | ✅ Current |
| `rehype-sanitize` | ^6.0.0 | 6.0.0 | ✅ Current |
| `browser-image-compression` | ^2.0.2 | 2.0.2 | ✅ Current |
| `sonner` | ^2.0.7 | 2.0.7 | ✅ Current |
| `@dnd-kit/core` | ^6.3.1 | 6.3.1 | ✅ Current |
| `@stripe/stripe-js` | ^8.9.0 | 8.9.0 | ✅ Current |
| `leaflet` / `react-leaflet` | ^1.9.4 / ^5.0.0 | current | ✅ Current |
| `topojson-client` | ^3.1.0 | 3.1.0 | ✅ Current |
| `vitest` / `@vitest/ui` | ^4.0.18 | 4.0.18 | ✅ Current |
| `eslint` | ^9 | 9.x | ✅ Current |
| `tailwindcss` | ^4 | 4.x | ✅ Current |
| `typescript` | ^5 | 5.x | ✅ Current |

---

## Fix Plan

| # | Finding | Action | Complexity | Status |
|---|---------|--------|-----------|--------|
| 1 | V1 — Next.js CSRF bypass + smuggling | `npm install next@16.2.0` | Low | ✅ 2026-03-20 |
| 2 | V2 — flatted DoS + Prototype Pollution | `npm audit fix` | Low | ✅ 2026-03-20 |
| 3 | V3 — undici 6 CVEs | `npm audit fix` | Low | ✅ 2026-03-20 |
| 4 | H1 — openai 5 versions behind | `npm install openai@latest` | Low | Pending |
| 5 | H2 — lucide-react 14 versions behind | `npm install lucide-react@latest` | Low | Pending |
