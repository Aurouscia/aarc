import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useSaveStore } from "./saveStore";
import { useEnvStore } from "./envStore";
import { useConfigStore } from "./configStore";
import { useStaClusterStore } from "./saveDerived/staClusterStore";
import ControlPointOptions from "@/components/sidebars/options/ControlPointOptions.vue";
import { Coord } from "../coord";
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import {useFormalizedLineStore} from "./saveDerived/formalizedLineStore.ts";
import { ControlPoint } from "../save.ts";
export const useNameEditStore = defineStore('nameEdit', ()=>{
    const cs = useConfigStore()
    const saveStore = useSaveStore()
    const envStore = useEnvStore()
    const formalizedLineStore = useFormalizedLineStore()
    const staClusterStore = useStaClusterStore()
    const { disposedStaNameOf } = storeToRefs(saveStore)
    disposedStaNameOf.value = disposedStaNameHandler
    const targetPtId = ref<number>()
    const nameMain = ref<string>()
    const nameSub = ref<string>()
    const edited = ref(false)
    const editing = ref(false)
    const nameInputFocusHandler = ref<()=>void>(()=>{})
    const nameEditorDiv = ref<HTMLDivElement>()
    const controlPointOptionsPanel = ref<InstanceType<typeof ControlPointOptions>>()
const { pop } = useUniqueComponentsStore()
    function startEditing(ptId:number, openOptionsPanel?:boolean){
        endEditing()
        if(saveStore.isPtNoSta(ptId))
            return
        const pt = saveStore.getPtById(ptId)
        if(pt){
            targetPtId.value = ptId
            nameMain.value = pt.name
            nameSub.value = pt.nameS
            editing.value = true
        }
        if(openOptionsPanel){
            controlPointOptionsPanelOpen()
        }
    }
    function controlPointOptionsPanelOpen(forPtId?:number){
        // if(!editing.value)
        //     return
        const pt = saveStore.getPtById(forPtId || targetPtId.value || -1)
        if(!pt)
            return
        if(controlPointOptionsPanel.value){
            controlPointOptionsPanel.value.startEditing(pt)
        }
    }
    
    function applyName(){
        const pt = saveStore.getPtById(targetPtId.value || -1)
        if(pt){
            if(!edited.value){
                edited.value = nameMain.value !== pt.name || nameSub.value !== pt.nameS
            }
            pt.name = nameMain.value
            pt.nameS = nameSub.value
            if(saveStore.isNamedPt(pt) && !pt.nameP){
                pt.nameP = newNamePos(pt.id)
            }
        }
    }
    function disposedStaNameHandler(ptId:number){
        if(targetPtId.value == ptId){
            targetPtId.value = -1
            nameMain.value = undefined
            nameSub.value = undefined
            editing.value = false;
            edited.value = false;
        }
    }

    function endEditing(){
        if(!editing.value){
            return
        }
        applyName()
        editing.value = false;
        //edited不动，因为可能结束编辑后一段时间还要读取是否edited，需要外部读取后重置状态
    }
    function toggleEditing(ptId:number){
        if(editing.value){
            endEditing()
        }else{
            startEditing(ptId)
        }
    }
    function getEditorDivEffectiveHeight(){
        if(!editing.value)
            return 0
        return nameEditorDiv.value?.clientHeight || 0
    }
    function applyNamePos(){
        const pt = saveStore.getPtById(targetPtId.value || -1)
        if(pt){
            pt.nameP = newNamePos(pt.id)
            envStore.rerender()
        }
    }
    function applyAllNamePos() {
        const confirmApplyAllNamePos=confirm("你真的要重置所有单点车站的站名位置吗？此操作无法考虑全部情况，且不可撤销！")
        if (!confirmApplyAllNamePos){
            return
        }
        applySomeNamePos(saveStore.save?.points||[])
    }
    function applySomeNamePos(points:ControlPoint[]){
        //暂时忽略车站团
        let allSinglePos=points.filter(p => {
            staClusterStore.isPtSingle(p.id)
        })||[]
        allSinglePos.forEach(x => {
            x.nameP = newNamePos(x.id)
        })
        pop?.show(`重置了${allSinglePos.length}个站名位置`, 'success')
        envStore.rerender()
    }
    const recommendedNamePos = [[[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]], [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]]]
    const sqrt2 = Math.sqrt(2)
    function getNextPtsPos(ptId: number) {
        const pt = saveStore.getPtById(ptId)
        if (!pt) {
            return []
        }
        const cluster = staClusterStore.getStaClusterById(ptId)
        const nextPtsPos =
            saveStore.getLinesByPt(ptId).map(x => {
                return formalizedLineStore.findAdjacentFormatPts(x.pts.findIndex(p => p == ptId), x.id)
            }).flat()
                .concat(staClusterStore.getRectOfCluster(cluster))
                .map(x => {
                    return [Math.sign(x[0] - pt?.pos[0]), Math.sign(x[1] - pt?.pos[1])]
                })
        return nextPtsPos
    }
    //用 pt  dir决定用哪个组
    function newNamePos(ptId: number): Coord {
        const pt = saveStore.getPtById(ptId)
        const ptSize = staClusterStore.getMaxSizePtWithinCluster(ptId, 'ptSize')
        const dist = cs.config.snapOctaClingPtNameDist * ptSize
        //自动选择不遮挡线路的位置
        if (pt) {
            //得到相邻点和这个站的相对位置
            const nextPtsPos = getNextPtsPos(ptId)
            for (let i = 0; i < 8; i++) {
                //有斜线就得用斜坐标点位
                let thisPos = recommendedNamePos[Number(!!nextPtsPos.find(np=>np[0]*np[1]!=0))][i]
                if (!nextPtsPos.find(pos => pos[0] == thisPos[0] && pos[1] == thisPos[1])) {
                    //没有重复，就用这个位置
                    if (thisPos[0] * thisPos[1] != 0) {
                        //斜边特征
                        return [thisPos[0] * dist / sqrt2, thisPos[1] * dist / sqrt2]
                    }
                    return [thisPos[0] * dist, thisPos[1] * dist]
                }
            }
            return [0, dist]
        }
        else {
            return [0, dist]
        }
    }

    function clearItems(){
        targetPtId.value = undefined
        nameMain.value = undefined
        nameSub.value = undefined
    }

    return { targetPtId, nameMain, nameSub, editing, edited,
        startEditing, endEditing, toggleEditing, applyName,
        nameInputFocusHandler, nameEditorDiv, getEditorDivEffectiveHeight,
        controlPointOptionsPanel, controlPointOptionsPanelOpen,
        newNamePos, clearItems,applyNamePos,applyAllNamePos,applySomeNamePos
    }
})