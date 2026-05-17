#!/usr/bin/env pwsh
# 启动 AARC.WebApi 到 49123 端口，并请求 /dev/GenApiTsClient
# 成功则退出码 0，否则退出码 1
#
# 用法:
#   .\gen-ts-client.ps1                  # 使用 dotnet run 启动（默认），写到 ../aarc/src/app/com/apiGenerated.ts
#   .\gen-ts-client.ps1 -Dll             # 使用已发布的 dotnet <dll> 启动
#   .\gen-ts-client.ps1 -Dll -Here       # 使用 DLL 启动，并写到当前目录 ./apiGenerated.ts

[CmdletBinding()]
param(
    [switch]$Dll,
    [switch]$Here
)

$ErrorActionPreference = 'Stop'

$ProjectDir = 'AARC.WebApi'
$Url = 'http://localhost:49123'

if ($Here) {
    $Endpoint = "$Url/dev/GenApiTsClient?writeHere=1"
} else {
    $Endpoint = "$Url/dev/GenApiTsClient"
}

$ProcessObj = $null

function Cleanup {
    if ($null -ne $ProcessObj -and !$ProcessObj.HasExited) {
        $ProcessObj.Kill() | Out-Null
        $ProcessObj.WaitForExit(5000) | Out-Null
    }
}

try {
    # 启动项目到指定端口（后台运行）
    $StartInfo = New-Object System.Diagnostics.ProcessStartInfo
    $StartInfo.UseShellExecute = $false
    $StartInfo.Environment['ASPNETCORE_ENVIRONMENT'] = 'Development'

    if ($Dll) {
        # 使用已发布的 DLL 启动（Docker 构建时使用）
        $StartInfo.WorkingDirectory = Join-Path $PWD 'publish'
        $StartInfo.FileName = 'dotnet'
        $StartInfo.Arguments = "AARC.WebApi.dll --urls `"$Url`""
    } else {
        # 使用 dotnet run 启动（本地开发时使用）
        $StartInfo.WorkingDirectory = Join-Path $PWD $ProjectDir
        $StartInfo.FileName = 'dotnet'
        $StartInfo.Arguments = "run --urls `"$Url`""
    }

    $ProcessObj = [System.Diagnostics.Process]::Start($StartInfo)

    # 等待服务就绪（最多 60 秒）
    $MaxWait = 60
    $Waited = 0
    $Ready = $false

    while ($Waited -lt $MaxWait) {
        try {
            $Response = Invoke-WebRequest -Uri "$Url/swagger/v1/swagger.json" -Method GET -UseBasicParsing -ErrorAction Stop
            if ($Response.StatusCode -eq 200) {
                $Ready = $true
                break
            }
        } catch {
            # 服务尚未就绪，继续等待
        }
        Start-Sleep -Seconds 1
        $Waited++
    }

    if (-not $Ready) {
        Write-Error "服务在 $MaxWait 秒内未启动" -ErrorAction Stop
    }

    # 发送请求到 /dev/GenApiTsClient
    try {
        $Response = Invoke-WebRequest -Uri $Endpoint -Method GET -UseBasicParsing -ErrorAction Stop
        $HttpStatus = $Response.StatusCode
    } catch {
        if ($_.Exception.Response) {
            $HttpStatus = [int]$_.Exception.Response.StatusCode
        } else {
            throw
        }
    }

    if ($HttpStatus -eq 200) {
        Write-Host "请求成功，HTTP 状态: $HttpStatus"
        exit 0
    } else {
        Write-Error "请求失败，HTTP 状态: $HttpStatus" -ErrorAction Stop
    }
} finally {
    Cleanup
}
