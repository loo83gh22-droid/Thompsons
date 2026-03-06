# FamilyNest Dependency & Supply Chain Findings

Last audit: **2026-03-06** (v2 — gaps addressed)
Auditor: Claude (dependency-review skill)
Result after fixes: `npm audit` → **0 vulnerabilities**

---

## Supply Chain Health (PASS)

| Check | Status | Notes |
|---|---|---|
| `package-lock.json` committed | ✅ | Reproducible installs guaranteed |
| No loose ranges (`*`, `>`, `>=`) | ✅ | All deps use `^` or exact pins |
| Critical packages pinned exactly | ✅ | `next`, `react`, `react-dom`, `eslint-config-next` |
| Known malicious package incidents | ✅ | No flagged packages found |
| Very low download-count packages | ✅ | All well-known first-party or popular ecosystem packages |
| Peer dependency warnings | ✅ | `npm install` output: **0 warnings** — all peer deps satisfied |

---

## Vulnerability Findings

### V1 — minimatch ReDoS (HIGH) ✅ FIXED

- **Package:** `minimatch` v3.1.2 and v9.0.5 (two transitive nodes)
- **CVEs:** GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74
- **Risk:** Catastrophically backtracking regex via repeated wildcards, GLOBSTAR segments, and nested extglobs.
- **Context:** Dev-time only — pulled in by `@typescript-eslint`. Not in production bundle.
- **Fix:** `npm audit fix` upgraded affected nodes.
- **Complexity:** Low (automated, build tools only)

### V2 — rollup Arbitrary File Write (HIGH) ✅ FIXED

- **Package:** `rollup` v4.57.1 (transitive via Vitest)
- **CVE:** GHSA-mw96-cpmx-2vgc
- **Risk:** Path traversal allows writing arbitrary files during builds if malicious input reaches the rollup bundler.
- **Context:** Dev/CI only — not in production.
- **Fix:** `npm audit fix` upgraded rollup to 4.58.1+.
- **Complexity:** Low (automated, dev tool)

### V3 — ajv ReDoS (MODERATE) ✅ FIXED

- **Package:** `ajv` <6.14.0 (transitive build tool dep)
- **CVE:** GHSA-2g4f-4pwh-qvx6
- **Risk:** ReDoS when using the `$data` option.
- **Context:** Dev toolchain only. Not exposed in production API or runtime.
- **Fix:** `npm audit fix` upgraded ajv.
- **Complexity:** Low (automated)

### V4 — mailparser XSS via resend (LOW) ✅ FIXED

- **Package:** `resend` 6.9.1 → `mailparser` <3.9.3
- **CVE:** GHSA-7gmj-h9xc-mcxc (CVSS 6.1)
- **Risk:** XSS in parsed email HTML. FamilyNest uses resend for **sending** only — not for parsing incoming email — so exploit surface is extremely limited.
- **Fix:** Upgraded `resend` to 6.9.3 which pulls mailparser ≥3.9.3.
- **Complexity:** Low (patch release, no API changes)

---

## Version Health Findings

### H1 — resend outdated + CVE ✅ FIXED
- 6.9.1 → **6.9.3** (fixed mailparser XSS, no breaking changes)

### H2 — @supabase/supabase-js minor update ✅ FIXED
- 2.94.1 → **2.98.0**

### H3 — @supabase/ssr minor update ✅ FIXED
- 0.8.0 → **0.9.0**

### H4 — stripe server SDK minor update ✅ FIXED
- 20.3.1 → **20.4.0**

### H5 — openai minor update ✅ FIXED
- 6.22.0 → **6.27.0**

### H6 — @upstash/redis patch ✅ FIXED
- 1.36.2 → **1.36.3**

### H7 — @stripe/stripe-js minor update ✅ FIXED
- 8.7.0 → **8.9.0** (client-side Stripe SDK)

### H8 — react / react-dom exact pin bump ✅ FIXED
- 19.2.3 → **19.2.4** (patch; exact pins in `package.json` updated manually)

---

## ESLint v10 Assessment (SKIP — intentional)

- **Installed:** eslint 9.39.2 (pinned as `"eslint": "^9"`)
- **Available:** eslint 10.0.2
- **Decision:** Skip. `^9` already prevents automatic upgrade to v10. ESLint v10 is a major version with removed deprecated rules and changed internals. `eslint-config-next` declares `peerDependencies: { eslint: ">=9.0.0" }` which technically allows v10, but this is a dev tool — a broken lint step blocks PRs without affecting production. Upgrade should be done deliberately with a test pass after `eslint-config-next` confirms v10 support.
- **Action:** Re-evaluate when `eslint-config-next` explicitly lists v10 in tested ranges.

---

## Unmaintained / Low-Activity Package Assessment

Packages checked for last publish date (2-year threshold = before 2024-03-06):

| Package | Last Published | Status | Notes |
|---|---|---|---|
| `react-organizational-chart` | 2023-04-13 | ⚠️ STALE | ~2.9 yrs, no updates. Used in family tree view. No CVEs; pure rendering lib. Monitor for React 19 compat issues. |
| `topojson-client` | 2022-06-27 | ⚠️ STALE | ~3.7 yrs. Maintained by Observable/Mike Bostock. Library is **specification-complete** — no new features needed. No CVEs. Low practical risk. |
| `react-confetti` | 2025-03-04 | ✅ Active | |
| `@react-google-maps/api` | 2025-12-16 | ✅ Active | |
| `react-markdown` | 2025-03-07 | ✅ Active | |
| `lucide-react` | Active | ✅ Active | Regular releases |
| `@dnd-kit/*` | Active | ✅ Active | |
| `leaflet` / `react-leaflet` | Active | ✅ Active | |
| `sonner` | Active | ✅ Active | |
| `zod` | Active | ✅ Active | |
| `jszip` | Active | ✅ Active | |
| `exifreader` | Active | ✅ Active | |

**Stale package actions:**
- `react-organizational-chart`: Search for alternatives (e.g. `@ant-design/x` org chart, or custom CSS tree). Low urgency — no CVEs, no React 19 issues observed in build. Flag for next major Next.js upgrade.
- `topojson-client`: No action needed. Spec-complete library, maintained by Observable. No CVEs.

---

## Packages Confirmed Up-to-Date / Secure

| Package | Installed | Notes |
|---|---|---|
| `next` | 16.1.6 (exact pin) | Pinned to tested version; update deliberately controlled |
| `react` / `react-dom` | 19.2.4 (exact pin) | Bumped to latest patch |
| `zod` | 4.3.6 | Current major (v4); no CVEs |
| `@upstash/ratelimit` | 2.0.8 | Current; no CVEs |
| `@dnd-kit/*` | current | No CVEs |
| `leaflet` / `react-leaflet` | current | No CVEs |
| `react-markdown` | 10.1.0 | Paired with `rehype-sanitize`; XSS risk mitigated |
| `jszip` | 3.10.1 | No CVEs |
| `exifreader` | 4.36.2 | No CVEs |

---

## Upgrade Plan

| Priority | Package | Action | Complexity | Status |
|---|---|---|---|---|
| P0 | minimatch, rollup, ajv | `npm audit fix` | Low | ✅ Done |
| P0 | resend → 6.9.3 | `npm install resend@latest` | Low | ✅ Done |
| P1 | supabase-js, ssr, stripe, openai, upstash/redis | `npm install ...@latest` | Low | ✅ Done |
| P1 | @stripe/stripe-js → 8.9.0 | `npm install @stripe/stripe-js@latest` | Low | ✅ Done |
| P1 | react/react-dom → 19.2.4 | Exact pin bump in package.json | Low | ✅ Done |
| P2 | eslint → v10 | Manual upgrade + lint test pass | Medium | Deferred |
| P2 | react-organizational-chart | Evaluate replacement or pin for React 19 | Medium | Deferred |
| P3 | next (next patch) | Check release notes, update exact pin | Medium | On next audit |
