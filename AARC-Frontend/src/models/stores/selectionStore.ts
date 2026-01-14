import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { ControlPoint, TextTag } from "../save";
import { Coord } from "../coord";
import { useSaveStore } from "./saveStore";
import { coordDistSqLessThan } from "@/utils/coordUtils/coordDist";
import { rectCoordDistSqLessThan } from "@/utils/coordUtils/coordRect";
import { useTextTagRectStore } from "./saveDerived/textTagRectStore";

export const useSelectionStore = defineStore('selection', ()=>{
    const selected = ref<Set<ControlPoint|TextTag>>(new Set())
    const mode = ref<'add'|'sub'|'idle'>('idle')
    const brushStatus = ref<'up'|'down'>('up')
    const working = computed(() => mode.value != 'idle' && brushStatus.value == 'down')
    const saveStore = useSaveStore()
    const { save } = storeToRefs(saveStore)
    const { enumerateTextTagRects } = useTextTagRectStore()
    
    const brushRadius = computed<number>(()=>100)
    function brush(coord?:Coord){
        if(!coord) return
        let radius = brushRadius.value
        const radiusSq = radius ** 2
        for(const p of save.value?.points ?? []){
            if(coordDistSqLessThan(coord, p.pos, radiusSq)){
                if(mode.value == 'add')
                    selected.value.add(p)
                else if(mode.value == 'sub')
                    selected.value.delete(p)
            }
        }
        enumerateTextTagRects((id, rect)=>{
            if(rectCoordDistSqLessThan(rect, coord, radiusSq)){
                const t = saveStore.getTextTagById(id)
                if(!t) return
                if(mode.value == 'add')
                    selected.value.add(t)
                else if(mode.value == 'sub')
                    selected.value.delete(t)
            }
        })
    }
    function setBrushStatus(status:'up'|'down'){
        brushStatus.value = status
    }

    // pinia单例，该语句仅执行一次
    document.addEventListener('keydown', e => {
        if(e.shiftKey){
            if (e.ctrlKey || e.metaKey) 
                mode.value = 'sub'
            else 
                mode.value = 'add'
        }
    });
    document.addEventListener('keyup', e => {
        if (!e.shiftKey){
            mode.value = 'idle'
        }
    });

    return {
        mode,
        working,
        brushRadius,
        brush,
        setBrushStatus
    }
})