param([switch]$Start)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$secret = Read-Host 'MySQL password for sodadev_o' -AsSecureString
$previous = $env:MYSQL_PASSWORD
try {
    $env:MYSQL_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
    node --env-file-if-exists=.env scripts/check-mysql.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    if ($Start) {
        $env:HOST = '127.0.0.1'
        npm.cmd start
        exit $LASTEXITCODE
    }
}
finally {
    $env:MYSQL_PASSWORD = $previous
    $secret.Dispose()
}
