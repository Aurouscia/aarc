import { Save, TextTag } from "@/models/save";

export function initFreshNewTextTags(s:Save, getNewId:()=>number){
    const initialTTs:TextTag[] = [{
        id:getNewId(),
        pos: [500, 300],
        text: "点击左侧的“线路”按钮，创建第一条线路\n点击本标签，然后拖拽到屏幕左上角，即可删除",
        textS: "如果不清楚怎么控制线路，请查看首页顶部的使用说明",
        textSOp: {color:'#999999', size: 1.2}
    }]
    s.textTags ??= []
    s.textTags.push(...initialTTs)
    console.log('[初始化]文本标签（新手引导用）')
}