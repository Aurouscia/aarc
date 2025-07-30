import { Save, TextTag } from "@/models/save";
import { introHead } from "@/models/stores/textTagEditStore";

export function initFreshNewTextTags(s:Save, getNewId:()=>number){
    const text = 
        `${introHead}\n` +
        "点击左侧的“线路”按钮，创建第一条线路\n" + 
        "点击线路的车站，拖动延长手柄，延长线路\n" + 
        "点击车站后，在顶部的输入框中输入站名\n" +
        "点击左侧“画布”按钮，可调整画布尺寸\n" +
        "点击本标签，然后拖拽到屏幕左上角删除"
    const initialTTs:TextTag[] = [{
        id:getNewId(),
        pos: [500, 10],
        text,
        textS: "如果不清楚怎么控制线路，请查看首页顶部的使用说明",
        textOp: {color: '#000000', size: 0.8},
        textSOp: {color:'#999999', size: 1.2},
        anchorY: 1,
        anchorX: 0,
        textAlign: 1
    }]
    s.textTags ??= []
    s.textTags.push(...initialTTs)
    console.log('[初始化]文本标签（新手引导用）')
}