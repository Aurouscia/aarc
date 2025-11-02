import { execa } from 'execa'
import { join } from 'path'
import { cwd } from 'process';
import { exit } from 'process';
import fs from 'fs'
import { GitInfo } from './gitInfo';

// 检查cwd下是否有package.json
if(!fs.existsSync(join(cwd(), 'package.json'))){
    console.error('请在项目根目录运行本脚本')
    exit(1)
}
// 检查是否有 --silence 参数
const silence = process.argv.includes('--silence')

const resPath = join(cwd(), 'public', 'gitInfo.json')
try{
    const branchNameRes = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
    const branchName = branchNameRes.stdout

    // 获取当前HEAD的提交ID（8个16进制字符）
    const commitIdRes = await execa('git', ['rev-parse', '--short=8', 'HEAD'])
    const commitId = commitIdRes.stdout

    const commitListAuthorsRes = await execa('git', ['log', '--pretty=format:%an'])
    const commitListAuthors = commitListAuthorsRes.stdout.split('\n')

    const contributingCount:{[key:string]:number} = {}
    for(const a of commitListAuthors){
        contributingCount[a] ??= 0
        contributingCount[a] += 1
    }

    const contributors = []
    for(const kv of Object.entries(contributingCount)){
        contributors.push({
            name:kv[0],
            count:kv[1]
        })
    }
    contributors.sort((x,y)=>y.count-x.count)
    
    const d = new Date()
    const builtAt = `${d.toLocaleDateString('zh-Hans')} ${d.toLocaleTimeString('zh-Hans')}`
    const resObj:GitInfo = {
        branchName,
        commitId,
        contributors,
        builtAt
    }
    if(!silence){
        console.log(resObj)
    }
    const res = JSON.stringify(resObj, undefined, 4)
    fs.writeFileSync(resPath, res)
}
catch(ex){
    console.error(ex)
}