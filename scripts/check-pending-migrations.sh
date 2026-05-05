#!/usr/bin/env bash
# check-pending-migrations.sh
# ----------------------------------------------------------
# Pre-merge sanity check for SQL migrations.
#
# CI does NOT auto-apply migrations on FamilyNest (see
# .github/workflows/supabase-migrations.yml lines 1–7 for why).
# The canonical workflow is: apply via Supabase MCP `apply_migration`
# BEFORE merging the PR.
#
# This script lists every .sql file in supabase/migrations/ that
# was added on the current branch (relative to origin/main) and
# reminds you to verify each is applied via MCP `list_migrations`
# before merge.
#
# Usage:
#   ./scripts/check-pending-migrations.sh
#
# Exit code 0: nothing to do (no new migration files on this branch)
# Exit code 1: new migration files found — go apply them via MCP

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# What's the base branch? Default to origin/main.
BASE="${BASE:-origin/main}"

# Make sure we have a fresh view of origin/main locally
git fetch origin main --quiet 2>/dev/null || true

# Find newly-added .sql files in supabase/migrations/ on this branch
NEW_FILES=$(git diff --name-only --diff-filter=A "$BASE"...HEAD -- 'supabase/migrations/*.sql' 2>/dev/null || true)

if [[ -z "$NEW_FILES" ]]; then
  echo "✅ No new migration files on this branch. Safe to merge."
  exit 0
fi

cat <<EOF
⚠️  This branch adds the following migration file(s):

$(echo "$NEW_FILES" | sed 's/^/  - /')

Before merging this PR, apply each one via Supabase MCP:

  1. Read the SQL file:    cat <file>
  2. Apply via MCP tool:   apply_migration (project_id: tstbngohenxrbqroejth)
  3. Verify with:          list_migrations (look for the migration name)

Reminder: CI does not auto-apply. If you skip this step, code that
depends on the new schema will fail in production until the migration
is applied manually.

EOF
exit 1
