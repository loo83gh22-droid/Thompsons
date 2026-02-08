# One-time script: Mark existing migrations as applied (database was set up manually).
# Run locally after: npx supabase login ; npx supabase link --project-ref YOUR_PROJECT_REF
# Usage: .\supabase\repair-migration-history.ps1

Set-Location $PSScriptRoot\..

Get-ChildItem supabase\migrations\*.sql | ForEach-Object {
  $version = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
  Write-Host "Repairing: $version"
  npx supabase migration repair $version --status applied --linked
}

Write-Host "Done. Run 'npx supabase db push --linked --yes' to apply any new migrations."
