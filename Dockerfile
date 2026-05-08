# 阶段一：后端构建
FROM mcr.azure.cn/dotnet/sdk:10.0 AS backend-build
WORKDIR /src

# 复制解决方案和项目文件
COPY AARC.slnx .
COPY AARC.Diff/AARC.Diff.csproj AARC.Diff/
COPY AARC.WebApi/AARC.WebApi.csproj AARC.WebApi/

# 还原依赖
RUN dotnet restore AARC.WebApi/AARC.WebApi.csproj

# 复制源码并构建
COPY AARC.Diff/ AARC.Diff/
COPY AARC.WebApi/ AARC.WebApi/
RUN dotnet build AARC.WebApi/AARC.WebApi.csproj -c Release -o /app/build
RUN dotnet publish AARC.WebApi/AARC.WebApi.csproj -c Release -o /app/publish

# 阶段二：生成 API TypeScript 客户端
FROM mcr.azure.cn/dotnet/sdk:10.0 AS api-gen
WORKDIR /src

# 安装 curl（用于测试服务就绪和发送请求）
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 复制已发布的后端文件
COPY --from=backend-build /app/publish ./publish
COPY --from=backend-build /src/AARC.WebApi/appsettings.json ./publish/

# 创建数据库目录（避免 sqlite 启动失败）
RUN mkdir -p ./publish/Data/SqliteFiles

# 复制并执行生成脚本（使用 --dll 模式，直接运行已发布的 DLL）
COPY gen-ts-client.sh .
RUN chmod +x gen-ts-client.sh
RUN ./gen-ts-client.sh --dll --here

# 阶段三：前端构建
FROM mcr.azure.cn/azurelinux/base/nodejs:24 AS frontend-build
WORKDIR /web

# 复制前端依赖文件
COPY aarc/package.json aarc/pnpm-lock.yaml* aarc/.npmrc aarc/pnpm-workspace.yaml ./

# 安装 pnpm 并安装依赖
RUN npm install -g pnpm --registry=https://registry.npmmirror.com
RUN pnpm install --frozen-lockfile

# 复制前端源码
COPY aarc/ .

# 复制生成的 API 客户端文件到前端源码目录
COPY --from=api-gen /src/publish/apiGenerated.ts ./src/app/com/apiGenerated.ts

ENV CI=true
RUN pnpm build-here

# 阶段四：运行
FROM mcr.azure.cn/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# 复制后端发布文件
COPY --from=backend-build /app/publish .

# 复制前端构建产物到 wwwroot（ASP.NET Core 默认静态文件目录）
COPY --from=frontend-build /web/dist ./wwwroot

# 暴露端口
EXPOSE 80
EXPOSE 443

# 启动应用
ENTRYPOINT ["dotnet", "AARC.WebApi.dll"]
