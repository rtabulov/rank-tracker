# Per-user SSLKEYLOGFILE + key-log ACL setup (companion #113)
# Invoked by MSI custom action or companion `apply_ssl_keylog` (setx/icacls equivalent).
#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$tlsDir = Join-Path $env:LOCALAPPDATA "RankTrackerCompanion\tls"
$keyLog = Join-Path $tlsDir "sslkeys.log"

New-Item -ItemType Directory -Force -Path $tlsDir | Out-Null

# Restrictive ACL: current user full control; no inherited grants.
icacls $tlsDir /inheritance:r | Out-Null
icacls $tlsDir /grant:r "$($env:USERNAME):(OI)(CI)F" | Out-Null

if (-not (Test-Path $keyLog)) {
  New-Item -ItemType File -Path $keyLog | Out-Null
}

# Persist for future processes (Steam/game must fully restart after this).
[Environment]::SetEnvironmentVariable("SSLKEYLOGFILE", $keyLog, "User")

Write-Output "SSLKEYLOGFILE=$keyLog"
