// ==========================================
// 提交信息钩子（确保提交信息符合约定）
// 使用方法：
// 1. 在 .git/hooks 目录下创建 commit-msg 文件（不要后缀名）
// 2. 在上述文件中添加以下内容：（即使在windows系统中，第一行的shebang也必须有）
//
//      #!/bin/sh
//      exit $(node ./commit-msg.mjs $1)
// 
// 3. （在非windows系统中）使用chmod确保该文件有执行权限
// ==========================================

import { readFileSync } from 'fs';

const commitMsgFilePath = process.argv[2]
const commitMsg = readFileSync(commitMsgFilePath, 'utf-8');
const requiredKeywords = ['【后端】','【前端】','【前端/后端】','【编辑器】','【编辑器/后端】','【项目】','Merge branch'];
const hasKeyword = requiredKeywords.some(keyword => commitMsg.startsWith(keyword));

if (!hasKeyword) {
    console.error(`提交信息必须以以下关键字开头：`+ requiredKeywords.join('/'));
    process.exit(1); // 退出代码 1 表示失败
}