#!/bin/sh
# 启动 AARC.WebApi 到 49123 端口，并请求 /dev/GenApiTsClient
# 成功则退出码 0，否则退出码 1
#
# 用法:
#   ./gen-ts-client.sh                  # 使用 dotnet run 启动（默认），写到 ../aarc/src/app/com/apiGenerated.ts
#   ./gen-ts-client.sh --dll            # 使用已发布的 dotnet <dll> 启动
#   ./gen-ts-client.sh --dll --here     # 使用 DLL 启动，并写到当前目录 ./apiGenerated.ts

set -e

USE_DLL=0
WRITE_HERE=0

for arg in "$@"; do
    case "$arg" in
        --dll)
            USE_DLL=1
            ;;
        --here)
            WRITE_HERE=1
            ;;
    esac
done

PROJECT_DIR="AARC.WebApi"
URL="http://localhost:49123"

if [ "$WRITE_HERE" -eq 1 ]; then
    ENDPOINT="$URL/dev/GenApiTsClient?writeHere=1"
else
    ENDPOINT="$URL/dev/GenApiTsClient"
fi

PID=""

cleanup() {
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null
        wait "$PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

# 启动项目到指定端口（后台运行）
if [ "$USE_DLL" -eq 1 ]; then
    # 使用已发布的 DLL 启动（Docker 构建时使用）
    cd publish
    ASPNETCORE_ENVIRONMENT=Development dotnet AARC.WebApi.dll --urls "$URL" &
    PID=$!
    cd ..
else
    # 使用 dotnet run 启动（本地开发时使用）
    cd "$PROJECT_DIR"
    ASPNETCORE_ENVIRONMENT=Development dotnet run --urls "$URL" &
    PID=$!
    cd ..
fi

# 等待服务就绪（最多 60 秒）
MAX_WAIT=60
WAITED=0
while [ "$WAITED" -lt "$MAX_WAIT" ]; do
    if curl -sf "$URL/swagger/v1/swagger.json" > /dev/null 2>&1; then
        break
    fi
    sleep 1
    WAITED=$((WAITED + 1))
done

if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    echo "服务在 $MAX_WAIT 秒内未启动" >&2
    exit 1
fi

# 发送请求到 /dev/GenApiTsClient
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "请求成功，HTTP 状态: $HTTP_STATUS"
    exit 0
else
    echo "请求失败，HTTP 状态: $HTTP_STATUS" >&2
    exit 1
fi
