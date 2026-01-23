import { execa, Options as ExecaOptions } from 'execa'
import fs from 'fs'

build()

async function build(){
    const firstParam = process.argv[2]
    const buildHere = firstParam?.toLowerCase() === '--here'
    const checkOnly = firstParam?.toLowerCase() === '--check-only'
    const viteBuildArgs = buildHere ? ['--outDir', './dist'] : []
    const execaOptions: ExecaOptions = {stdout:'inherit', stderr:'inherit', reject:false}

    const vueTsc = execa("npx", ["vue-tsc"], execaOptions)
    if(checkOnly){
        console.log('🔍 ts check started')
        const res = await vueTsc
        if(res.exitCode == 0) console.log('✅ ts check passed')
        else console.log('❌ ts check failed')
        return
    }
    const gitInfoGen = execa('npx', ['tsx', './src/utils/gitInfo/gitInfoGen.ts', '--silence'], {...execaOptions})
    const viteBuild = execa("npx", ["vite", "build", ...viteBuildArgs], {...execaOptions})
    fs.copyFileSync('./src/app/com/apiGenerated.ts', './public/apiGenerated.ts')
    await Promise.all([gitInfoGen, vueTsc, viteBuild])
}