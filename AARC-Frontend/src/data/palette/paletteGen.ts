import fs from 'fs'
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

const res:string[] = []
const resPath = join(__dirname, 'palette.ts')

res.push('//=======================================================')
res.push('//本文件为自动生成，请勿手动编辑，操作方法见同目录的README.md')
res.push('//=======================================================')
res.push('import {ref} from \'vue\';')
res.push('')
writeForSubDir('real')
writeForSubDir('fic')
fs.writeFileSync(resPath, res.join('\n'))

function writeForSubDir(subDirNamePure:string){
    const subDir = join(__dirname, subDirNamePure)
    if(!fs.existsSync(subDir))
        return
    // 遍历子目录下的所有文件
    const files = fs.readdirSync(subDir)
    const citiesHere:CityTemp[] = []
    for (const file of files) {
        if(!file.endsWith('.ts'))
            continue
        const priStr = file.split('-', 1).at(0)
        const restEnd = file.length - 3
        const rest = file.substring(4, restEnd)
        if(!priStr || !rest)
            continue
        const pri = parseInt(priStr)
        if(isNaN(pri))
            continue
        citiesHere.push({
            pri,
            dirName: subDirNamePure,
            displayName: rest,
            fileName: file,
            importName: `${subDirNamePure}_${pri}`
        })
    }
    citiesHere.sort((x,y)=> x.pri-y.pri)
    for (const city of citiesHere){
        res.push(`import ${city.importName} from './${subDirNamePure}/${city.fileName}'`)
    }
    res.push(`export const ${subDirNamePure} = [`)
    for(const c of citiesHere){
        res.push(`    {name:'${c.displayName}', pri:${c.pri}, data:${c.importName},open:ref(false)},`)
        }
    res.push(']')
    res.push('')
}

interface CityTemp{
    pri:number,
    dirName:string
    displayName:string,
    fileName:string,
    importName:string
}