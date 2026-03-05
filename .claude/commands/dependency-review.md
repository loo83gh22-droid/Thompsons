# FamilyNest Dependency & Supply Chain Review

Conduct a **thorough, structured dependency audit** of the FamilyNest codebase (familynest.io) across two axes:

---

## 1 — Vulnerability Exposure
*Are there known CVEs or supply chain risks in the current dependencies?*

Check each of the following:

### npm Audit
- Run `npm audit --json` and report all **critical** and **high** severity CVEs.
- For each CVE: package name, affected version range, fixed version, and a plain-English description of the risk.
- Flag any CVEs in packages that handle: authentication (`@supabase/ssr`, `@supabase/supabase-js`), file uploads, cryptography, or HTML rendering — these are highest priority.

### Supply Chain Risks
- Are any packages pinned to an exact version or using `^` / `~` in `package.json`? Loose ranges (`*`, `>`, `>=`) are a red flag.
- Are there any packages that have had a recent ownership transfer or were found to contain malicious code in the last 12 months? (Check against known incidents for packages in `package.json`.)
- Are there any packages with very low download counts (< 1000 weekly) that are not first-party Anthropic/Vercel/Supabase packages? These are higher supply chain risk.
- Does `package-lock.json` exist and is it committed to the repo? (Ensures reproducible installs.)

---

## 2 — Version Health
*Are dependencies current enough to receive security patches?*

Check each of the following:

### Critical Path Packages (check these first)
For each of the following, report current version vs. latest stable version:
- `next` — Next.js (check for security advisories in release notes)
- `react` / `react-dom`
- `@supabase/supabase-js` / `@supabase/ssr`
- `stripe`
- `resend`
- `@upstash/redis` / `@upstash/ratelimit`
- `zod` (used for Server Action validation)

### Deprecated or Abandoned Packages
- Are any packages using deprecated Node.js APIs (check for deprecation warnings in `npm audit`)?
- Are there packages with no commits or releases in the last 2 years? These are unmaintained and won't receive security patches.
- Are there packages whose maintainers have published a deprecation notice or pointed to a successor?

### Compatibility
- Does the current `next` version match the Vercel deployment target? (Check `@vercel/next` or adapter version if present.)
- Are there `peer dependency` warnings in `npm install` output that indicate version mismatches?

---

## Audit Instructions

1. Use the **Bash tool** to run `npm audit --json` from the project root and capture the output.
2. Read `package.json` to get the full dependency list with pinned versions.
3. Produce a **numbered findings list** grouped by Vulnerability (V#) and Version Health (H#).
4. For each finding include:
   - **Package name** and current version
   - **CVE / risk description**
   - **Recommended action** (upgrade to X.Y.Z, replace with alternative, or no action needed with justification)
   - **Upgrade complexity** (Low = patch/minor with no breaking changes, Medium = minor with API changes, High = major version)
5. After listing all findings, **propose an upgrade plan** ordered by severity — security fixes first, then version health.
6. Note packages that were checked and found to be **up to date and secure** (to confirm coverage).

Before starting, read `docs/DEPENDENCY_FINDINGS.md` (if it exists) to skip items already marked ✅ FIXED — only flag **new or regressed** issues.
After the audit, update `docs/DEPENDENCY_FINDINGS.md`: add new findings with their V#/H# codes, and mark anything you confirmed as resolved with ✅ FIXED.
