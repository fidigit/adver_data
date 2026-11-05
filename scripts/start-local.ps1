param([int]$Port = 18081)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$env:PORT = "$Port"
$env:HOST = '0.0.0.0'
node --env-file-if-exists=.env server.mjs
if ($LASTEXITCODE -ne 0) { throw '服务启动或运行失败，请检查 Node.js 版本及端口占用' }
