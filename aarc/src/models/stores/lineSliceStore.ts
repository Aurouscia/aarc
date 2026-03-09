import { defineStore } from "pinia"
import { useSaveStore } from "./saveStore"
import { computed, ref } from "vue"
import { LineSlice } from "../save"

export const useLineSliceStore = defineStore('lineSliceStore',()=>{
    const saveStore = useSaveStore()
    
    // 正在创建的片段状态
    type CreatingSliceState = {
        ptIds: number[],           // 已选中的点ID
        candidateLineIds: number[] // 候选线路ID（当多个线路共享这两个点时）
    }
    
    const creatingSlice = ref<CreatingSliceState>()
    const creatingStyleId = ref<number>()
    
    const isCreating = computed(()=>!!creatingSlice.value)
    
    type Step = 'idle' | 'selectFirstPt' | 'selectSecondPt' | 'selectLine'
    
    /** 当前步骤 */
    const currentStep = computed<Step>(()=>{
        if(!creatingSlice.value) return 'idle'
        const ptCount = creatingSlice.value.ptIds.length
        if(ptCount === 0) return 'selectFirstPt'
        if(ptCount === 1) return 'selectSecondPt'
        // 有两个点后，如果有多个候选线路，需要第三步选择线路
        if(creatingSlice.value.candidateLineIds.length > 1) return 'selectLine'
        return 'idle' // 只有两个点且只有一个候选线路，自动完成
    })
    
    /** 帮助文本 */
    const helpText = computed(()=>{
        const step = currentStep.value
        if(step === 'selectFirstPt') return '请点击起点'
        if(step === 'selectSecondPt') return '请点击终点'
        if(step === 'selectLine') return '请点击要应用片段的线路'
        return ''
    })

    function startCreatingSlice(){
        creatingSlice.value = {
            ptIds: [],
            candidateLineIds: []
        }
    }

    /** 查找包含这两个点的所有线路 */
    function findLinesContainingPoints(pt1: number, pt2: number): number[]{
        if(!saveStore.save) return []
        const lineIds: number[] = []
        for(const line of saveStore.save.lines){
            const hasPt1 = line.pts.includes(pt1)
            const hasPt2 = line.pts.includes(pt2)
            if(hasPt1 && hasPt2){
                lineIds.push(line.id)
            }
        }
        return lineIds
    }

    function slicePtClick(ptId:number): boolean{
        if(!isCreating.value || !saveStore.save) return false
        
        const slice = creatingSlice.value!
        
        // 避免重复点击同一点
        if(slice.ptIds.includes(ptId)) return false
        
        slice.ptIds.push(ptId)
        
        // 选中了两个点
        if(slice.ptIds.length === 2){
            const [fromPt, toPt] = slice.ptIds
            
            // 查找包含这两个点的所有线路
            slice.candidateLineIds = findLinesContainingPoints(fromPt, toPt)
            
            // 没有线路包含这两个点
            if(slice.candidateLineIds.length === 0){
                abortCreatingSlice()
                return false
            }
            
            // 只有一个候选线路，自动创建
            if(slice.candidateLineIds.length === 1){
                createSlice(slice.candidateLineIds[0], fromPt, toPt)
                return true
            }
            
            // 多个候选线路，进入第三步，等待用户点击线路
            return true
        }
        
        return false
    }

    /** 用户点击线路时调用 */
    function sliceLineClick(lineId: number): boolean{
        if(!isCreating.value || !saveStore.save) return false
        
        const slice = creatingSlice.value!
        
        // 必须已经选了两个点
        if(slice.ptIds.length !== 2) return false
        
        // 必须是在候选线路中选择
        if(!slice.candidateLineIds.includes(lineId)) return false
        
        const [fromPt, toPt] = slice.ptIds
        createSlice(lineId, fromPt, toPt)
        return true
    }

    function createSlice(lineId: number, fromPt: number, toPt: number){
        if(!saveStore.save) return
        
        if(!saveStore.save.lineSlices)
            saveStore.save.lineSlices = []
        
        // 检查是否已存在相同起止点的片段
        if(!containExistingSliceBetween(lineId, fromPt, toPt)){
            const newSlice: LineSlice = {
                id: saveStore.save.idIncre++,
                line: lineId,
                fromPt,
                toPt,
                style: creatingStyleId.value
            }
            saveStore.save.lineSlices.push(newSlice)
        }
        
        creatingSlice.value = undefined
    }

    function containExistingSliceBetween(lineId: number, pt1: number, pt2: number){
        if(!saveStore.save?.lineSlices) return undefined
        return saveStore.save.lineSlices.find(
            slice => slice.line === lineId && 
            ((slice.fromPt === pt1 && slice.toPt === pt2) || 
             (slice.fromPt === pt2 && slice.toPt === pt1))
        )
    }

    function abortCreatingSlice(){
        creatingSlice.value = undefined
    }

    function deleteSlice(sliceId: number){
        if(!saveStore.save?.lineSlices) return
        const idx = saveStore.save.lineSlices.findIndex(s => s.id === sliceId)
        if(idx >= 0){
            saveStore.save.lineSlices.splice(idx, 1)
        }
    }

    function updateSliceStyle(sliceId: number, styleId: number | undefined){
        if(!saveStore.save?.lineSlices) return
        const slice = saveStore.save.lineSlices.find(s => s.id === sliceId)
        if(slice){
            slice.style = styleId
        }
    }

    return{
        creatingSlice,
        creatingStyleId,
        isCreating,
        currentStep,
        helpText,
        startCreatingSlice,
        abortCreatingSlice,
        slicePtClick,
        sliceLineClick,
        deleteSlice,
        updateSliceStyle,
        clearItems: abortCreatingSlice,
    }
})
