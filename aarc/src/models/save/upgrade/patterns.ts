import { Save } from "@/models/save"

export const freshNewPatternsVersion = 0
export function initFreshNewPatterns(s:Save, getNewId:()=>number){
    s.patterns ??= []
    s.patterns.push(
        {
            id: getNewId(),
            name: '网格',
            width: 15,
            height: 15,
            grid:{
                width: 1,
                color: '#ffffff',
                opacity: 0.5,
                rise45: true,
                fall45: true
            }
        })
    console.log('[初始化]pattern')
}
export function upgradePatterns(s:Save, _getNewId:()=>number){
    const ver = s.meta.patternsVersion ?? 0
    if(ver < 1){
        //预留
    }
}