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

function getBuiltAt(){
    const d = new Date()
    return `${d.toLocaleDateString('zh-Hans')} ${d.toLocaleTimeString('zh-Hans')}`
}

async function gitCommandAvailable(): Promise<boolean> {
    try {
        const res = await execa('git', ['--version'], { reject: false })
        return res.exitCode === 0
    } catch {
        return false
    }
}

async function gitWorkTreeAvailable(): Promise<boolean> {
    try {
        const res = await execa('git', ['rev-parse', '--is-inside-work-tree'], { reject: false })
        return res.exitCode === 0 && res.stdout.trim() === 'true'
    } catch {
        return false
    }
}

function writeGitInfo(resObj: GitInfo){
    if(!silence){
        console.log(resObj)
    }
    const res = JSON.stringify(resObj, undefined, 4)
    fs.writeFileSync(resPath, res)
}

function writeFallbackGitInfo(){
    const resObj: GitInfo = {
        branchName: 'unknown',
        commitId: 'unknown',
        contributors: [],
        builtAt: getBuiltAt()
    }
    if(!silence){
        console.log('未检测到 Git 环境，使用兜底信息：', resObj)
    }
    writeGitInfo(resObj)
}

async function main(){
    const isGitCmdAvailable = await gitCommandAvailable()
    const isGitWorkTreeAvailable = await gitWorkTreeAvailable()
    if(!isGitCmdAvailable || !isGitWorkTreeAvailable){
        writeFallbackGitInfo()
        return
    }

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

        const resObj:GitInfo = {
            branchName,
            commitId,
            contributors,
            builtAt: getBuiltAt()
        }
        writeGitInfo(resObj)
    }
    catch(ex){
        console.error('获取 Git 信息失败：', ex)
        writeFallbackGitInfo()
    }
}

await main()
