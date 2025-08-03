# 前端目录
- 如果使用vscode且需要编辑代码，建议安装插件`Vue-Official`
- 代码中缺少一个自动生成的`apiGenerated.ts`文件，拉取代码后需要由开发者通过`SwaggerUI`生成，具体步骤见下文

## 首先
1. 确保本地安装了`node.js`尽可能新的稳定版本
2. 命令行运行`npm install`，若长时间无反应，更换国内镜像源
3. 启动**后端调试**，并进入`/swagger`
4. 找到`Dev/GenApiTsClient`，点击`Try it out`，再点击`Execute`，生成`apiGenerated.ts`文件

### 注意
如果拉取了代码更新，且：
1. 更新了npm依赖项：需要重新`npm install`
2. 更新了api：需要重新进入`/swagger`生成`apiGenerated.ts`文件

## 编译
编译前端代码，结果会自动输出到后端的`wwwroot`目录下
```bash
npm run build
```

## 调试
启动一个调试服务器，以便观察代码更改的效果
```bash
npm run dev
```
命令行会输出一个访问地址，`ctrl+点击`即可打开

## 代码贡献统计
```sh
npm run commitSum
```
运行上述命令，将会使用相关node脚本（根据git仓库内的提交记录）更新“关于”页面中展示的代码贡献者名单。  
设备中必须有powershell，才能运行本功能。