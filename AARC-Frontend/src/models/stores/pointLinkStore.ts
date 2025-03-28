import { defineStore } from "pinia"
import { useSaveStore } from "./saveStore"
import { computed, ref } from "vue"
import { ControlPointLinkType } from "../save"

export const usePointLinkStore = defineStore('pointLinkStore',()=>{
    const linkLength = 2
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
            if(creatingLink.value?.size === linkLength){
                const newLink = Array.from(creatingLink.value)
                if(!saveStore.save.pointLinks)
                    saveStore.save.pointLinks = []
                if(!containExistingLinkBetween(newLink[0], newLink[1])){
                    saveStore.save.pointLinks.push({
                        pts: newLink,
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

    function getLinkLinkedPts(){
        const pts:number[] = []
        if(saveStore.save?.pointLinks){
            saveStore.save.pointLinks.forEach(link=>{
                pts.push(...link.pts)
            })
        }
        return pts
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
        getLinkLinkedPts
    }
})