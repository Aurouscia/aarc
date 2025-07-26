import { Save } from "@/models/save"

export const freshNewTextTagIconsVersion = 0
export function upgradeTextTagIcons(s:Save, getNewId:()=>number){
    s.textTagIcons ??= []
    const ver = s.meta.textTagIconsVersion ?? 0
    if(ver < 1){
        s.textTagIcons.push(
            { id: getNewId(), width: 50, name: 'a-机场', url: '/icons/a/airport.svg' },
            { id: getNewId(), width: 50, name: 'a-火车', url: '/icons/a/train.svg' }
        )
        s.meta.textTagIconsVersion = 1
        console.log('[升级]图标:1')
    }
}