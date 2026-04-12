# FamilyNest Dependency & Supply Chain Findings

Last audited: 2026-04-05

---

## Scale Context

793 audited packages (up from 676 — new test deps added). **5 new vulnerabilities** found in 2026-04-05 audit (0 critical, 3 high, 2 moderate). All prior findings remain fixed.

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

### V4 — `vite` 7.0.0–7.3.1: 3 CVEs including arbitrary file read via WebSocket ✅ FIXED (2026-04-05)
**Package:** `vite` (transitive via `vitest@^4.0.18` → devDependency)
**Scope:** Dev only — never in production Vercel build
**Fix available:** Yes (`npm audit fix`)

| Advisory | Severity | Description |
|---|---|---|
| GHSA-p9ff-h696-f583 | High | Arbitrary file read via Vite dev server WebSocket — attacker can read files outside `root` if dev server is exposed |
| GHSA-v2wj-q39q-566r | High | `server.fs.deny` bypass via URL query params — allowlist intended to restrict sensitive file access is circumventable |
| GHSA-4w7w-66w2-5vf9 | Moderate | Path traversal in optimized deps `.map` handling — can leak source map contents |

**Production risk:** None — `vite` is the Vitest dev runner, not used in Next.js production builds or Vercel deploys.
**Dev risk:** Low — only exploitable if the Vite dev server is intentionally exposed on a network interface (default is localhost only).
**Recommended action:** `npm audit fix` — upgrades `vite` to 7.3.2+. **Upgrade complexity: Low.**

---

### V5 — `@xmldom/xmldom` 0.9.0–0.9.8: XML injection via unsafe CDATA ✅ FIXED (2026-04-05)
**Package:** `@xmldom/xmldom` (transitive — dependency chain unknown without `npm ls`)
**Severity:** High (CVSS 7.5) — GHSA-wh4c-j3r5-mjhp
**Fix available:** Yes (`npm audit fix`)

**Description:** Unsafe CDATA serialization allows attacker-controlled markup to be injected into XML output — an XML injection / XSS-class vulnerability. An attacker who can influence serialized content could insert arbitrary XML/HTML nodes.

**Production risk:** Moderate if this package reaches a production code path. `@xmldom/xmldom` is likely pulled in by a mapping/chart library (`react-organizational-chart`, `react-leaflet`, or a PDF-related tool) — needs `npm ls @xmldom/xmldom` to confirm the chain. If it's devDependency-only (e.g., via jsdom/vitest), risk is low.
**Recommended action:** `npm audit fix` to upgrade to 0.9.9+. Then run `npm ls @xmldom/xmldom` to confirm the dependency chain. **Upgrade complexity: Low.**

---

### V6 — `picomatch` ≤2.3.1 and 4.0.0–4.0.3: ReDoS + method injection ✅ FIXED (2026-04-05)
**Package:** `picomatch` (transitive — appears in both production and dev node paths)
**Severity:** High (CVSS 7.5 for ReDoS) — GHSA-c2c7-rcm5-vvqj, GHSA-3v7f-55p6-f55p
**Fix available:** Yes (`npm audit fix`)

| Advisory | Severity | Description |
|---|---|---|
| GHSA-c2c7-rcm5-vvqj | High | ReDoS via extglob quantifiers — crafted glob pattern causes catastrophic backtracking, hanging Node process |
| GHSA-3v7f-55p6-f55p | Moderate | Method injection in POSIX character classes — incorrect glob matching allows unintended file path matches |

**Affected nodes:** Root `node_modules/picomatch` (may be in production path via Next.js file watching), `tinyglobby`, `vite`, `vitest`.
**Production risk:** Low-moderate — picomatch in Next.js handles internal file watching during build/dev, not user-supplied patterns. Exploiting ReDoS requires control over glob patterns, which no user-facing endpoint provides.
**Recommended action:** `npm audit fix`. **Upgrade complexity: Low.**

---

### V7 — `brace-expansion` <1.1.13 and 2.0.0–2.0.2: DoS via zero-step sequence ✅ FIXED (2026-04-05)
**Package:** `brace-expansion` (transitive via `@typescript-eslint/typescript-estree` and root)
**Severity:** Moderate (CVSS 6.5) — GHSA-f886-m6hf-6m8v
**Fix available:** Yes (`npm audit fix`)

**Description:** A zero-step sequence (e.g., `{0..0..0}`) causes an infinite loop, hanging the process and exhausting memory.
**Production risk:** Low — `brace-expansion` is used internally by glob/minimatch for pattern matching. No user-facing endpoint passes raw brace patterns. Root dep may be in production via minimatch/glob in Next.js.
**Recommended action:** `npm audit fix`. **Upgrade complexity: Low.**

---

### V8 — `yaml` 1.0.0–1.10.2: Stack overflow via deeply nested collections ✅ FIXED (2026-04-05)
**Package:** `yaml` (transitive via `cosmiconfig` → config loader, likely devDependency)
**Severity:** Moderate (CVSS 4.3) — GHSA-48c2-rrv3-qjmp
**Fix available:** Yes (`npm audit fix`)

**Description:** Parsing a YAML document with deeply nested collections causes a stack overflow (unbounded recursion). Requires attacker-supplied YAML input.
**Production risk:** None — `cosmiconfig` reads local config files (`.eslintrc`, `postcss.config.js`, etc.) at build/dev time only, never from user input.
**Recommended action:** `npm audit fix`. **Upgrade complexity: Low.**

---

### V9 — `next` 16.0.0-beta.0–16.2.2: Denial of Service via Server Components ✅ FIXED (2026-04-05)
**Package:** `next` (direct production dependency — critical path)
**Severity:** High — GHSA-q4gf-8mx6-v5v3
**Scope:** Production

**Description:** A crafted request can trigger unbounded work in Server Components rendering, causing denial of service. FamilyNest uses Server Components on every dashboard page.

**Fix:** Upgraded `next` from `16.2.0` → `16.2.3` (exact pin preserved). Also bumped `eslint-config-next` and `@next/third-parties` to `16.2.3`.
**Upgrade complexity:** Low — patch bump, no breaking changes.

---

## Version Health Findings (H#)

### H1 — `openai` behind on 6.x (Low, no CVE) ✅ FIXED (2026-04-05)
**Upgraded:** `^6.27.0` → `^6.34.0` via `npm install openai@latest`.

### H2 — `lucide-react` behind on 0.x icon releases (Low, no CVE) ✅ FIXED (2026-04-05)
**Upgraded:** `^0.563.0` → `^0.577.0` via `npm install lucide-react@^0` (stayed on 0.x — v1.x has breaking icon renames, held back intentionally).

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
| 4 | V4 — vite 3 CVEs (arbitrary file read, path traversal) | `npm audit fix` | Low | ✅ 2026-04-05 |
| 5 | V5 — @xmldom/xmldom XML injection | `npm audit fix` | Low | ✅ 2026-04-05 |
| 6 | V6 — picomatch ReDoS + method injection | `npm audit fix` | Low | ✅ 2026-04-05 |
| 7 | V7 — brace-expansion DoS | `npm audit fix` | Low | ✅ 2026-04-05 |
| 8 | V8 — yaml stack overflow | `npm audit fix` | Low | ✅ 2026-04-05 |
| 9 | V9 — next 16.2.2 Server Components DoS | `npm install next@16.2.3` | Low | ✅ 2026-04-05 |
| 10 | H1 — openai behind 6.x | `npm install openai@latest` | Low | ✅ 2026-04-05 |
| 11 | H2 — lucide-react behind 0.x | `npm install lucide-react@^0` | Low | ✅ 2026-04-05 |

**0 open vulnerabilities as of 2026-04-05.**
