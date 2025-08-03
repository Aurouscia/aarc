import { execa } from 'execa'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

const scriptPath = join(__dirname, 'commitSum.ps1')
const resPath = join(__dirname, 'commitSumRes.ts')
try{
    const { stdout } = await execa('pwsh', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath
    ],{ encoding: 'utf8' })
    console.log(stdout)
    const rows = stdout.split('\n').map(x=>x.trim())
    const d = new Date()
    const updatedAt = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    const contributors = rows.map(x=>{
        const sepped = x.split('::')
        const name = sepped[0]
        const count = sepped[1]
        return {
            name,
            count
        }
    })
    const resObj = {
        contributors,
        updatedAt
    }
    const res = `export default ${JSON.stringify(resObj, undefined, 4)}`
    fs.writeFileSync(resPath, res)
}
catch(ex){
    console.error(ex)
}