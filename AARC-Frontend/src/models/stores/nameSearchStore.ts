import { defineStore, storeToRefs } from "pinia";
import { computed, nextTick, ref } from "vue";
import { useEnvStore } from "./envStore";
import { ControlPoint } from "../save";
import { coordDist } from "@/utils/coordUtils/coordDist";
import { numberCmpEpsilon } from "@/utils/consts";
import { useEditorLocalConfigStore } from "@/app/localConfig/editorLocalConfig";
import { useSaveStore } from "./saveStore";

export const searchMarkForEmptyName = '---'

export const useNameSearchStore = defineStore('nameSearch', ()=>{
    const showPrivate = ref(false)
    const show = computed(()=>showPrivate.value)
    const searchText = ref<string>()
    const searchInput = ref<HTMLInputElement>()
    const saveStore = useSaveStore()
    const showResults = computed(()=>{
        return show.value && !!searchText.value?.trim()
    })

    function init(searchInputElement:HTMLInputElement){
        searchInput.value = searchInputElement
    }
    function toggleShow(force?:boolean|string){
        if(force === undefined){
            force = !showPrivate.value
        }
        if(force){
            if(typeof force === 'string'){
                nextTick(()=>{
                    searchText.value = force
                })
            }
        }
        else{
            searchText.value = ''
        }
        const newValueOfShow = !!force
        if(newValueOfShow){
            searchInput.value?.focus()
            const envStore = useEnvStore()
            envStore.endEveryEditing({rerenderIfEdited:true})
            envStore.cancelActive()
        }
        showPrivate.value = newValueOfShow
    }

    const { duplicateNameDistThrs } = storeToRefs(useEditorLocalConfigStore())
    function ptFarEnough(p0: ControlPoint, p1: ControlPoint){
        let dist = coordDist(p0.pos, p1.pos)
        let thrs = Number(duplicateNameDistThrs.value) ?? 0
        let farEnough = dist > (thrs + numberCmpEpsilon)
        return farEnough
    }
    function findDuplicateAndFarEnough(){
        const seen = new Set<string>();
        const dup = new Set<string>()
        for (const pt of saveStore.save?.points ?? []) {
            let n = pt.name?.trim()
            if(n){
                if (seen.has(n))
                    dup.add(n)
                else
                    seen.add(n);
            }
        }
        let found:string|undefined = undefined
        dup.forEach(dupName=>{
            if(found) return
            const pts = saveStore.save?.points.filter(x => x.name && dupName == x.name?.trim())
            if(pts && pts.length > 1){
                if(ptFarEnough(pts[0], pts[1])){
                    found = dupName
                }
            }
        })        
        return found;
    }

    return {
        show, searchText, searchInput, showResults, toggleShow, init,
        ptFarEnough, findDuplicateAndFarEnough
    }
})