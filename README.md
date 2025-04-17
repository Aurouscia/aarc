<img src="https://gitee.com/au114514/aarc/raw/master/AARC-Frontend/src/assets/logo/aarc.svg" width="150px" style="display:block;margin:auto"/>

<div style="text-align:center;margin-top:15px">
<div style="font-size:22px">先进型抽象线路图画布</div>
Advanced Abstract Route Canvas
</div>

## 使用地址
http://aarc.jowei19.com

## 项目地址
[Gitee（本体）](https://gitee.com/au114514/aarc)  
[Github（自动同步镜像）](https://github.com/Aurouscia/aarc)  
issue请在gitee提出，github那边一般不看

## 主要功能
- 绘制线条角度为45度整数倍的线路图，以及车站、水体、出站换乘、线路列表等内容
- 完全支持在所有类型设备（PC/平板/手机）上进行编辑，可双指或滚轮缩放视角

## 特色功能
- 多人同时协作编辑同一张画布（还没做）
- 可自由插入图片（例如该线路图所属公司logo等）（还没做）
- 智能的网格/临近车站吸附
- 导出各线路所经站点列表（Excel等格式）（还没做）
- 城市分区->客流量模拟计算（还没做）

## 架构
- 前端：vue3 + vite + ts
- 后端：aspNetCore
- 双向即时通讯：signalR
- ORM：entityFrameworkCore

## 安装
### 前提条件
1. [Visual Studio](https://visualstudio.microsoft.com/zh-hans/) 尽可能新版+web应用开发负载
2. [node客户端](https://nodejs.org/en) 尽可能新版，并确认命令行中有npm命令可用
3. [git客户端](https://git-scm.com/downloads) 用来下载代码和提交更新
4. [visual studio code](https://code.visualstudio.com/download)（和第一条是两个东西）用来编辑前端代码
5. 一台windows系统的服务器（照理说linux的也行，请自行研究.net网站部署方法）  
TODO：dockerfile

### 步骤
1. 下载代码文件  
    - 如果使用git，在命令行中输入`git clone 【本仓库链接】`
2. 使用vscode进入前端文件夹(/AARC-Frontend)，在命令行中输入`npm ci`和`npm run build`
    - 如果`npm ci`失败，设置npm国内镜像源
    - 如果需要编辑代码，建议安装插件`Vue-Official`
3. 双击项目根目录的sln文件，进入vs
4. 顶部栏-工具-Nuget包管理器-包管理器控制台，在控制台中输入`update-database`
    - 该操作将在本地生成/更新数据库架构
5. 点击顶部绿色启动按钮启动调试，检查是否正常
6. 停止调试，点击顶部栏`生成-发布`即可选择位置导出
7. windows服务器上安装`.net9.0 hosting bundle`
8. 把导出的程序移动到服务器上，并给予Users用户组该文件夹的控制权限，用IIS新建网站并指向该文件夹
    - 第一次移动时带上数据库(.db文件)
    - 后续不要把数据库覆盖了
9. 尝试启动并进入网站

*TODO：部署后更新数据库架构的方法*

## 帮助
**部署遇到问题，请加qq群 798877093 联系作者**  
**使用遇到问题，请加qq群 1083848751 联系作者或其他用户**

## 许可证
Apache-2.0