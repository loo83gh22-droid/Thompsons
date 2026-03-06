# FamilyNest Dependency & Supply Chain Findings

Last audit: **2026-03-06**
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
| Very low download-count packages | ✅ | All deps are well-known first-party or popular ecosystem packages |

---

## Vulnerability Findings

### V1 — minimatch ReDoS (HIGH) ✅ FIXED

- **Package:** `minimatch` v3.1.2 and v9.0.5 (two transitive nodes)
- **CVEs:** GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74
- **Risk:** Catastrophically backtracking regex via repeated wildcards, GLOBSTAR segments, and nested extglobs. Attacker-controlled glob patterns could cause DoS.
- **Context:** Dev-time only — pulled in by `@typescript-eslint`. Not in production bundle.
- **Fix:** `npm audit fix` upgraded affected nodes.
- **Complexity:** Low (automated, build tools only)

### V2 — rollup Arbitrary File Write (HIGH) ✅ FIXED

- **Package:** `rollup` v4.57.1 (transitive via Vitest)
- **CVE:** GHSA-mw96-cpmx-2vgc
- **Risk:** Path traversal allows writing arbitrary files during builds if malicious input reaches the rollup bundler.
- **Context:** Dev/CI only — not in production. Risk only materialises if malicious code is introduced into the build pipeline.
- **Fix:** `npm audit fix` upgraded rollup to 4.58.1+.
- **Complexity:** Low (automated, dev tool)

### V3 — ajv ReDoS (MODERATE) ✅ FIXED

- **Package:** `ajv` <6.14.0 (transitive build tool dep)
- **CVE:** GHSA-2g4f-4pwh-qvx6
- **Risk:** ReDoS when using the `$data` option. Only triggerable if user-controlled input reaches `$data`-powered schemas.
- **Context:** Dev toolchain only. Not exposed in production API or runtime.
- **Fix:** `npm audit fix` upgraded ajv.
- **Complexity:** Low (automated)

### V4 — mailparser XSS via resend (LOW) ✅ FIXED

- **Package:** `resend` 6.9.1 → `mailparser` <3.9.3
- **CVE:** GHSA-7gmj-h9xc-mcxc (CVSS 6.1)
- **Risk:** XSS in parsed email HTML. FamilyNest uses resend for **sending** transactional email only — not for parsing incoming email — so the exploit surface is extremely limited in practice.
- **Fix:** Upgraded `resend` to 6.9.3 which pulls mailparser ≥3.9.3.
- **Complexity:** Low (patch release, no API changes)

---

## Version Health Findings

### H1 — resend outdated + CVE (LOW → FIXED) ✅ FIXED

- 6.9.1 → **6.9.3** (fixed mailparser XSS, no breaking changes)

### H2 — @supabase/supabase-js minor update ✅ FIXED

- 2.94.1 → **2.98.0** (patch/minor releases; auth client stays current for security patches)

### H3 — @supabase/ssr minor update ✅ FIXED

- 0.8.0 → **0.9.0** (minor; server-side session handling improvements)

### H4 — stripe server SDK minor update ✅ FIXED

- 20.3.1 → **20.4.0** (minor; billing portal and webhook improvements)

### H5 — openai minor update ✅ FIXED

- 6.22.0 → **6.27.0** (minor; API compatibility improvements)

### H6 — @upstash/redis patch ✅ FIXED

- 1.36.2 → **1.36.3** (patch)

---

## Packages Checked and Found Up-to-Date / Acceptable

| Package | Installed | Notes |
|---|---|---|
| `next` | 16.1.6 (exact pin) | Pinned to tested version; update deliberately controlled |
| `react` / `react-dom` | 19.2.3 (exact pin) | Pinned; 19.2.4 available but minor |
| `zod` | 4.3.6 | Current major (v4); no CVEs |
| `@stripe/stripe-js` | 8.7.0 | Client-side Stripe SDK; 8.9.0 available (minor, low priority) |
| `@upstash/ratelimit` | 2.0.8 | Current; no CVEs |
| `lucide-react` | 0.563.0 | 0.577.0 available; icon library, no security impact |
| `@dnd-kit/*` | current | No CVEs |
| `leaflet` / `react-leaflet` | current | No CVEs |
| `react-markdown` | 10.1.0 | Paired with `rehype-sanitize`; XSS risk mitigated |
| `jszip` | 3.10.1 | No CVEs; used for export ZIP only |
| `exifreader` | 4.36.1 | No CVEs |

---

## Upgrade Plan (priority order)

All critical fixes were applied immediately in this audit session. Remaining low-priority items:

| Priority | Package | Action | Complexity |
|---|---|---|---|
| Done | minimatch, rollup, ajv | `npm audit fix` | Low |
| Done | resend → 6.9.3 | `npm install resend@latest` | Low |
| Done | supabase-js, ssr, stripe, openai, upstash/redis | `npm install ...@latest` | Low |
| Optional | react/react-dom 19.2.4 | Update exact pin in package.json | Low |
| Optional | @stripe/stripe-js 8.9.0 | `npm install @stripe/stripe-js@latest` | Low |
| Optional | next (if 16.x patch available) | Check release notes before updating | Medium |
