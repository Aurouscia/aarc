import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { ControlPoint, TextTag } from "../save";
import { Coord } from "../coord";
import { useSaveStore } from "./saveStore";
import { coordDistSqLessThan } from "@/utils/coordUtils/coordDist";
import { rectCoordDistSqLessThan } from "@/utils/coordUtils/coordRect";
import { useTextTagRectStore } from "./saveDerived/textTagRectStore";
import { coordAdd, coordSub } from "@/utils/coordUtils/coordMath";

type SelectionTarget = ControlPoint|TextTag
export const useSelectionStore = defineStore('selection', ()=>{
    const selected = ref<Set<SelectionTarget>>(new Set())
    const mode = ref<'add'|'sub'|'idle'>('idle')
    const brushStatus = ref<'up'|'down'>('up')
    const enabled = computed(() => mode.value != 'idle')
    const working = computed(() => mode.value != 'idle' && brushStatus.value == 'down')
    const showControl = ref(false)
    const showedControl = ref(false)
    const selCursor = ref<Coord>()
    const saveStore = useSaveStore()
    const { save } = storeToRefs(saveStore)
    const { enumerateTextTagRects } = useTextTagRectStore()
    
    const brushRadius = computed<number>(()=>100)
    function brush(coord?:Coord){
        selCursor.value = coord
        if(!coord || !working.value) return
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

    function enableForTouchScreen(setMode?:'add'|'sub'){
        mode.value = setMode ?? 'add'
        showControl.value = true
        showedControl.value = true
    }
    function disableForTouchScreen(){
        mode.value = 'idle'
        showControl.value = false
        selCursor.value = undefined
    }

    const draggingOriginal = ref<Coord>()
    const draggingDelta = ref<Coord>()
    function draggingStart(c:Coord){
        draggingOriginal.value = c
        draggingDelta.value = undefined
    }
    function draggingDrag(c:Coord){
        if(!draggingOriginal.value) return
        draggingDelta.value = coordSub(c, draggingOriginal.value)
    }
    function draggingCommit(draggedItem:SelectionTarget){
        if(selected.value.size == 0 || !draggingDelta.value){
            return false
        }
        selected.value.forEach(s=>{
            if(draggedItem === s) return
            s.pos = coordAdd(s.pos, draggingDelta.value ?? [0, 0])
        })
        draggingOriginal.value = undefined
        draggingDelta.value = undefined
        return true
    }

    // pinia单例，该语句仅执行一次
    document.addEventListener('keydown', e => {
        setMode(e)
    });
    document.addEventListener('keyup', e => {
        setMode(e)
    });
    function setMode(e: KeyboardEvent){
        if(e.shiftKey) {
            if (e.ctrlKey || e.metaKey) 
                mode.value = 'sub'
            else 
                mode.value = 'add'
        } else {
            mode.value = 'idle'
        }
    }

    return {
        selected,
        mode,
        working,
        enabled,
        showControl,
        showedControl,
        selCursor,
        brushRadius,
        brush,
        setBrushStatus,
        enableForTouchScreen,
        disableForTouchScreen,
        draggingDelta,
        draggingStart,
        draggingDrag,
        draggingCommit
    }
})