import { DataSource } from "../save";

export function defaultDataSources(getNewId:()=>number): DataSource[] {
    return [{
        id: getNewId(),
        name: '滨蜀颜色库',
        url: 'http://binshu.jowei19.com/colorsetsapi.json',
        type: 'colorSets',
        autoUpdate: true,
        overwriteSameName: true
    }]
}