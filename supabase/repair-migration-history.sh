#!/bin/bash
# One-time script: Mark existing migrations as applied (database was set up manually).
# Run locally after: npx supabase login && npx supabase link --project-ref YOUR_PROJECT_REF
# Usage: bash supabase/repair-migration-history.sh

cd "$(dirname "$0")/.."

for f in supabase/migrations/*.sql; do
  version=$(basename "$f" .sql)
  echo "Repairing: $version"
  npx supabase migration repair "$version" --status applied --linked
done

echo "Done. Run 'npx supabase db push --linked --yes' to apply any new migrations."
