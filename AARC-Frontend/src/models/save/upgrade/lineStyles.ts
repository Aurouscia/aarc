import { Save } from "@/models/save";

export const currentlineStyleVersion = 0
export const freshNewLineStyleVersion = -1
export function upgradeLineStyles(s:Save, getNewId:()=>number){
    const ver = s.meta.lineStylesVersion ?? 0
    if(ver < 0){
        upgradeTo0(s, getNewId)
        s.meta.lineStylesVersion = 0
        console.log("[升级]线路风格:0")
    }
}
function upgradeTo0(s:Save, getNewId:()=>number){
    s.lineStyles ??= []
    s.lineStyles.push(
        {
            id: getNewId(),
            name: '快线',
            layers:[
                {color:'#FFFFFF', width:0.15, opacity:1}
            ]
        },
        {
            id: getNewId(),
            name: '铁路',
            layers:[
                {color:'#FFFFFF', width:0.6, opacity:1, dash:'4 4'}
            ]
        }
    )
}