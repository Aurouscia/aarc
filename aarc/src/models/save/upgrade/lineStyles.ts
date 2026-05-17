import { LineStyle, Save } from "@/models/save";

export const freshNewLineStylesVersion = 1
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

export function upgradeLineStyle(ls:LineStyle){
    for(const layer of ls.layers){
        if('dashCap' in layer){
            layer.cap = layer.dashCap as any
            delete (layer as any).dashCap
        }
    }
}

export function upgradeLineStyles(s:Save, _getNewId:()=>number){
    const ver = s.meta.lineStylesVersion ?? 0
    if(ver < 1){
        s.lineStyles ??= []
        for(const ls of s.lineStyles){
            upgradeLineStyle(ls)
        }
        s.meta.lineStylesVersion = 1
        console.log('[升级]线路样式:1')
    }
}