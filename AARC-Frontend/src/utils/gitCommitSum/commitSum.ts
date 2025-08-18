import { execa } from 'execa'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url';
import { exit } from 'process';
import fs from 'fs'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

const resPath = join(__dirname, 'commitSumRes.ts')
try{
    const branchNameRes = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
    const branchName = branchNameRes.stdout
    if(branchName != 'master'){
        console.error(`当前分支为[${branchName}]，本脚本只能在[master]分支运行`)
        exit(1)
    }
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
    const updatedAt = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    const resObj = {
        contributors,
        updatedAt
    }
    console.log(resObj)
    const res = `export default ${JSON.stringify(resObj, undefined, 4)}`
    fs.writeFileSync(resPath, res)
}
catch(ex){
    console.error(ex)
}