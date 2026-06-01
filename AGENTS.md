# AARC 项目 Agent 指南

## 启动 WebApi 服务

如果需要用 CLI 启动 WebApi 服务，应该先查看 `AARC.WebApi/Properties/launchSettings.json`，使用其中的 **"http"** profile 的端口启动服务。

当前 "http" profile 配置：
- URL: `http://localhost:5250`
- 环境变量: `ASPNETCORE_ENVIRONMENT=Development`

启动命令示例：
```bash
cd AARC.WebApi
ASPNETCORE_ENVIRONMENT=Development dotnet run --urls "http://localhost:5250"
```
