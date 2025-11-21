# 前端目录
- 如果使用vscode且需要编辑代码，建议安装插件`Vue-Official`
- 代码中缺少一个自动生成的`apiGenerated.ts`文件，拉取代码后需要由开发者通过`SwaggerUI`生成，具体步骤见下文

## 首先
1. 确保本地安装了`node.js`尽可能新的稳定版本
2. 在本目录打开命令行，运行`npm install`，npm会自动使用国内镜像源
3. 启动**后端调试**，并在浏览器地址栏进入`<调试域名>/swagger`
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
**（注意：启动调试前必须先编译一次）**  
启动一个调试服务器，以便观察代码更改的效果
```bash
npm run dev
```
命令行会输出一个访问地址，`ctrl+点击`即可打开

### 调试时连接指定服务
在`env`目录中新建`.env.development.local`，填写如下内容：
```env
VITE_ApiUrlBase = "http://aarc.jowei19.com" #或其他服务实例（注意结尾不要斜杠）
```

## 开发备忘录
- ⚠️注意：不要将fs、execa等仅在node使用的模块导入运行时代码（直接或间接），否则会出现难以辨认的打包/运行时问题
- 如果前后端域名不一致，导出可能会失败，因为canvas上如果有跨域图片，会被认为是“污染的”（tainted），浏览器会拒绝导出