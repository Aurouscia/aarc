# 前端目录
- 如果使用vscode且需要编辑代码，建议安装插件`Vue-Official`
- 代码中缺少一个自动生成的`apiGenerated.ts`文件，需要某些操作来添加，具体步骤见下文

## 准备
1. 确保本地安装了`node.js`尽可能新的稳定版本
2. 在本目录打开命令行，运行`npm install`，npm会自动使用国内镜像源

### 不自己启动后端（无需安装dotnet）
3. 访问 http://aarc.jowei19.com/apiGenerated.ts 下载最新的`apiGenerated.ts`
4. 搜索`apiStore.ts`的位置，并将上一步下载的文件放到其同一目录下

### 自己启动后端
3. 启动**后端调试**，并在浏览器地址栏进入`<调试域名>/dev/GenApiTsClient`
4. 接着`apiGenerated.ts`文件就会自动出现在它应该在的位置
5. 在`env`目录中新建`.env.development.local`，填写如下内容：

    ```env
    VITE_DevProxyTarget = "http://localhost:5250"
    ```
    这样可以改为访问自己的后端服务

### 注意
如果拉取了代码更新，且运行时发现问题，大概率是因为：
- npm依赖项有更新：需要重新`npm install`
- api有更新：需要按上述“准备”步骤重新获取`apiGenerated.ts`文件

## 编译
编译前端代码
```bash
npm run build # 结果会输出到后端的wwwroot目录下
# 或
npm run build-here # 结果会输出到./dist目录下
```

## 调试
**（注意：启动调试前必须先编译一次）**  
启动一个调试服务器，以便观察代码更改的效果
```bash
npm run dev
```
命令行会输出一个访问地址，`ctrl+点击`即可打开

## 开发备忘录
- ⚠️注意：不要将fs、execa等仅在node使用的模块导入运行时代码（直接或间接），否则会出现难以辨认的打包/运行时问题
- 如果前后端域名不一致，导出可能会失败，因为canvas上如果有跨域图片，会被认为是“污染的”（tainted），浏览器会拒绝导出