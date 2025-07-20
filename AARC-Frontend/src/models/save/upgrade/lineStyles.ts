import { Save } from "@/models/save";

export const freshNewLineStyleVersion = 0
export function initFreshNewLineStyles(s:Save, getNewId:()=>number){
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
        })
    console.log('[初始化]线路样式')
}
export function upgradeLineStyles(s:Save, _getNewId:()=>number){
    const ver = s.meta.lineStylesVersion ?? 0
    if(ver < 1){
        //预留
    }
}