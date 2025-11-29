import { defineStore } from "pinia"
import { useSaveStore } from "./saveStore"
import { computed, ref } from "vue"
import { ControlPoint, ControlPointLinkType } from "../save"

export const usePointLinkStore = defineStore('pointLinkStore',()=>{
    const saveStore = useSaveStore()
    const creatingLink = ref<Set<number>>()
    const creatingLinkType = ref<ControlPointLinkType>(ControlPointLinkType.fat)
    const isCreating = computed(()=>!!creatingLink.value)
    const helpTextNumber = computed(()=>{
        if(creatingLink.value){
            return creatingLink.value.size+1
        }
    })
    function startCreatingPtLink(){
        creatingLink.value = new Set<number>()
    }
    function ptLinkClick(ptId:number){
        if(isCreating.value && saveStore.save){
            creatingLink.value?.add(ptId)
            if(creatingLink.value?.size === 2){
                const newLink = Array.from(creatingLink.value)
                const pts:[number, number] = [newLink[0], newLink[1]]
                if(!saveStore.save.pointLinks)
                    saveStore.save.pointLinks = []
                if(!containExistingLinkBetween(...pts)){
                    saveStore.save.pointLinks.push({
                        pts: pts,
                        type: creatingLinkType.value || ControlPointLinkType.fat
                    })
                }
                creatingLink.value = undefined
                return true
            }
        }
    }
    function containExistingLinkBetween(pt1:number, pt2:number){
        if(saveStore.save?.pointLinks){
            return saveStore.save.pointLinks.find(link=>link.pts.includes(pt1) && link.pts.includes(pt2))
        }
    }
    function abortCreatingPtLink(){
        creatingLink.value = undefined
    }

    function getLinkLinkedPts(excludeDot?:'excludeDot'){
        const pts:number[] = []
        if(saveStore.save?.pointLinks){
            saveStore.save.pointLinks.forEach(link=>{
                if(excludeDot && link.type === ControlPointLinkType.dot)
                    return
                pts.push(...link.pts)
            })
        }
        return pts
    }
    function getClusterLinksPts():ControlPoint[][]{
        const links = saveStore.save?.pointLinks?.filter(x=>x.type === ControlPointLinkType.cluster) ?? []
        const res:ControlPoint[][] = []
        for(const link of links){
            const pts = []
            for(const ptId of link.pts){
                const pt = saveStore.getPtById(ptId)
                if(pt){
                    pts.push(pt)
                }
            }
            if(pts.length>1){
                res.push(pts)
            }
        }
        return res;
    }

    return{
        creatingLink,
        creatingLinkType,
        isCreating,
        helpTextNumber,
        startCreatingPtLink,
        abortCreatingPtLink,
        ptLinkClick,
        clearItems: abortCreatingPtLink,
        getLinkLinkedPts,
        getClusterLinksPts
    }
})