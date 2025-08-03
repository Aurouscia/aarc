[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "master") {
    Write-Host "错误：当前分支为 '$currentBranch'，请在 master 分支上运行此脚本。" -ForegroundColor Red
    exit 1
}

$gitLog = git log --pretty=format:"%an" | Group-Object | Sort-Object Count -Descending
$gitLog | ForEach-Object {
    Write-Host "$($_.Name)::$($_.Count)"
}