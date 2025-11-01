import { execa } from 'execa'

const firstParam = process.argv[2]
const buildHere = firstParam?.toLowerCase() === '--here'
const viteBuildArgs = buildHere ? ['--outDir', './dist'] : []

const gitInfoGen = execa('npx', ['tsx', './src/utils/gitInfo/gitInfoGen.ts', '--silence'], {stdout:'inherit', reject:true})
const viteBuild = execa("npx", ["vite", "build", ...viteBuildArgs], {stdout:'inherit', reject:true});
const vueTsc = execa("npx", ["vue-tsc"], {stdout:'inherit', reject:true})
await Promise.all([gitInfoGen, vueTsc, viteBuild])