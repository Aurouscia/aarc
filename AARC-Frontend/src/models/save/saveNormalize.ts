import { Save, SaveMetaData, TextTag } from "../save"
import { initFreshNewConfig, upgradeConfig } from "./upgrade/config"
import { freshNewLineStyleVersion, initFreshNewLineStyles, upgradeLineStyles } from "./upgrade/lineStyles"
import { ensureValidCvsSize } from "./valid/cvsSize"
import { ensureValidIdIncre } from "./valid/idIncre"

export function normalizeSave(obj:any){
    let freshNew = false
    if(
        !(obj instanceof Object)
        || (obj instanceof Object && Object.keys(obj).length === 0))
    {
        obj = {}
        freshNew = true
    }
    const ownPropNames = Object.getOwnPropertyNames(obj)
    const fillDefault = (propName:keyof Save, mustBe:'array'|'object'|'number', defaultVal:object|number|(()=>object))=>{
        let needFill = false
        if(!ownPropNames.includes(propName))
            needFill = true
        else{
            const value = obj[propName]
            if(mustBe == 'array'){
                needFill = !(value instanceof Array)
            }else if(mustBe == 'object'){
                needFill = !(value instanceof Object) 
            }else if(mustBe == 'number'){
                needFill = !(typeof value === 'number')
            }
        }
        if(needFill){
            console.warn(`[规范化]属性"${propName}"缺失，已使用默认值补充`)
            if(typeof defaultVal === 'object' || typeof defaultVal === 'number')
                obj[propName] = defaultVal
            else
                obj[propName] = defaultVal()
        }
    }
    fillDefault('lines', 'array', [])
    fillDefault('points', 'array', [])
    fillDefault('cvsSize', 'array', [1000, 1000]),
    fillDefault('textTags', 'array', [])
    fillDefault('config', 'object', {})
    fillDefault('idIncre', 'number', 1)
    ensureValidIdIncre(obj)
    //确认了idIncre有值后，才能进行下面的“全新存档初始化”步骤（会使idIncre自增）
    const getNewId = ()=>obj.idIncre++
    if(freshNew){
        fillDefault('meta', 'object', getFreshNewMeta())
        initFreshNewLineStyles(obj, getNewId)
        initFreshNewConfig(obj)
        const initialTTs:TextTag[] = [{
            id:getNewId(),
            pos: [500, 300],
            text: "点击左侧的“线路”按钮，创建第一条线路\n点击本标签，然后拖拽到屏幕左上角，即可删除",
            textS: "如果不清楚怎么控制线路，请查看首页顶部的使用说明",
            textSOp: {color:'#999999', size: 1.2}
        }]
        obj['textTags'] = initialTTs
    }else{
        fillDefault('meta', 'object', {})
    }
    ensureValidCvsSize(obj)
    upgradeLineStyles(obj, getNewId)
    upgradeConfig(obj)
    return obj as Save
}
function getFreshNewMeta():SaveMetaData{
    return {
        lineStylesVersion: freshNewLineStyleVersion
    }
}