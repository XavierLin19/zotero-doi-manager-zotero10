param([string]$OutputPath = (Join-Path $PSScriptRoot 'dist/zotero-doi-manager-1.5.0.10-zotero10-rebuilt.xpi'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$target = [IO.Path]::GetFullPath($OutputPath)
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
[IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $PSScriptRoot 'source'), $target)
Get-FileHash -LiteralPath $target -Algorithm SHA256
