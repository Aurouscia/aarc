import { defineStore } from "pinia"
import { useSaveStore } from "./saveStore"
import { computed, ref } from "vue"
import { LineSlice } from "../save"

export const useLineSliceStore = defineStore('lineSliceStore',()=>{
    const saveStore = useSaveStore()
    
    // 正在创建的片段：记录选中的线路ID和点ID集合
    const creatingSlice = ref<{
        lineId: number,
        ptIds: number[]
    }>()
    const creatingStyleId = ref<number>()
    
    const isCreating = computed(()=>!!creatingSlice.value)
    
    /** 正在添加第x个点 */
    const helpTextNumber = computed(()=>{
        if(creatingSlice.value){
            return creatingSlice.value.ptIds.length + 1
        }
    })

    function startCreatingSlice(lineId: number){
        creatingSlice.value = {
            lineId,
            ptIds: []
        }
    }

    function slicePtClick(ptId:number){
        if(!isCreating.value || !saveStore.save) return false
        
        const slice = creatingSlice.value!
        
        // 避免重复点击同一点
        if(slice.ptIds.includes(ptId)) return false
        
        slice.ptIds.push(ptId)
        
        // 选中了两个点，创建片段
        if(slice.ptIds.length === 2){
            const [fromPt, toPt] = slice.ptIds
            
            if(!saveStore.save.lineSlices)
                saveStore.save.lineSlices = []
            
            // 检查是否已存在相同起止点的片段
            if(!containExistingSliceBetween(slice.lineId, fromPt, toPt)){
                const newSlice: LineSlice = {
                    id: saveStore.save.idIncre++,
                    line: slice.lineId,
                    fromPt,
                    toPt,
                    style: creatingStyleId.value
                }
                saveStore.save.lineSlices.push(newSlice)
            }
            
            creatingSlice.value = undefined
            return true
        }
        return false
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
        helpTextNumber,
        startCreatingSlice,
        abortCreatingSlice,
        slicePtClick,
        deleteSlice,
        updateSliceStyle,
        clearItems: abortCreatingSlice,
    }
})
