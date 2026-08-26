# Fetch / stage a pinned Windows tshark payload for Tauri MSI bundling (#113).
# Prefer an existing Wireshark install; optionally download Portable if missing.
# Binaries stay gitignored under src-tauri/resources/tshark/
#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Dest = Join-Path $Root "src-tauri\resources\tshark"
$PinVersion = "4.6.8"
$WiresharkDir = $env:WIRESHARK_DIR
if (-not $WiresharkDir) {
  $candidates = @(
    "${env:ProgramFiles}\Wireshark",
    "${env:ProgramFiles(x86)}\Wireshark"
  )
  $WiresharkDir = $candidates | Where-Object { Test-Path (Join-Path $_ "tshark.exe") } | Select-Object -First 1
}

function Clear-Dest {
  if (Test-Path $Dest) {
    Get-ChildItem $Dest -Force | Where-Object { $_.Name -ne "README.md" } | Remove-Item -Recurse -Force
  } else {
    New-Item -ItemType Directory -Path $Dest | Out-Null
  }
}

function Copy-TsharkPayload([string]$SourceDir) {
  $exe = Join-Path $SourceDir "tshark.exe"
  if (-not (Test-Path $exe)) {
    throw "tshark.exe not found in $SourceDir"
  }

  $verOut = & $exe --version 2>&1 | Out-String
  if ($verOut -notmatch [regex]::Escape($PinVersion)) {
    Write-Warning "Expected tshark $PinVersion; got:`n$verOut"
  }

  Clear-Dest

  # Root CLI + shared libs (exclude Wireshark GUI + Npcap redistributables).
  $excludeNames = @(
    "Wireshark.exe",
    "Wireshark.exe.manifest",
    "Stratoshark.exe",
    "npcap-*.exe",
    "USBPcap*.exe",
    "uninstall.exe",
    "vcredist*.exe"
  )

  Get-ChildItem $SourceDir -File | ForEach-Object {
    $skip = $false
    foreach ($pat in $excludeNames) {
      if ($_.Name -like $pat) { $skip = $true; break }
    }
    if (-not $skip) {
      Copy-Item $_.FullName -Destination $Dest -Force
    }
  }

  foreach ($dir in @("plugins", "extcap", "snmp", "radius", "diameter", "profiles", "dtc")) {
    $src = Join-Path $SourceDir $dir
    if (Test-Path $src) {
      Copy-Item $src -Destination (Join-Path $Dest $dir) -Recurse -Force
    }
  }

  # GPL notices from upstream install when present.
  foreach ($notice in @("COPYING", "COPYING.txt", "README", "README.txt", "AUTHORS", "NEWS")) {
    $n = Join-Path $SourceDir $notice
    if (Test-Path $n) {
      Copy-Item $n -Destination $Dest -Force
    }
  }

  @"
version=$PinVersion
source=$SourceDir
staged=$(Get-Date -Format o)
notes=Npcap installer executables intentionally excluded (link-out only).
"@ | Set-Content -Path (Join-Path $Dest "PAYLOAD_VERSION.txt") -Encoding utf8

  $tshark = Join-Path $Dest "tshark.exe"
  & $tshark --version | Select-Object -First 3
  Write-Host "Staged payload at $Dest"
}

if (-not $WiresharkDir) {
  throw @"
No Wireshark install found with tshark.exe.

Option A (manual):
  1. Install Wireshark $PinVersion from https://www.wireshark.org/download.html
  2. Re-run: pwsh apps/companion/installer/fetch-tshark-payload.ps1

Or set WIRESHARK_DIR to a folder that contains tshark.exe.
"@
}

Write-Host "Using Wireshark at $WiresharkDir"
Copy-TsharkPayload $WiresharkDir
