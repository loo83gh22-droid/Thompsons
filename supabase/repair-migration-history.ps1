# One-time script: Mark existing migrations as applied (database was set up manually).
# Run locally after: npx supabase login ; npx supabase link --project-ref YOUR_PROJECT_REF
# Usage: .\supabase\repair-migration-history.ps1

Set-Location $PSScriptRoot\..

Get-ChildItem supabase\migrations\*.sql | ForEach-Object {
  # Version is the numeric prefix (e.g. "001" from "001_initial_schema.sql")
  $version = $_.BaseName -replace '_.*', ''
  Write-Host "Repairing: $version"
  npx supabase migration repair $version --status applied --linked
}

Write-Host "Done. Run 'npx supabase db push --linked --yes' to apply any new migrations."
