import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useSaveStore } from "./saveStore";
import { Scaler } from "@/utils/scaler";
import { Coord } from "../coord";
import { coordDistSq } from "@/utils/coordDist";
import { clickControlPointThrsSq } from "@/utils/consts";

export const useEnvStore = defineStore('env', ()=>{
    const mode = ref<"none"|"pt">("none")
    const moveSwitch = computed<boolean>(()=>mode.value=='none')
    const saveStore = useSaveStore();
    const activeId = ref<number>(-1)
    const cvsFrame = ref<HTMLDivElement>()
    const cvsCont = ref<HTMLDivElement>()
    const cvsWidth = ref<number>(1)
    const cvsHeight = ref<number>(1)
    let scaler:Scaler;
    function init(){
        if(!cvsCont.value || !cvsFrame.value)
            return
        scaler = new Scaler(cvsFrame.value, cvsCont.value, ()=>{}, moveSwitch)
        scaler.widthReset()
        cvsCont.value.addEventListener('click', clickHandlerBinded)
    }
    function clickHandler(e:MouseEvent){
        const coord = translate([e.offsetX, e.offsetY]);
        if(!coord)
            return
        const pt = onPt(coord)
        if(pt){
            activeId.value = pt.id
            mode.value = 'pt'
            console.log(pt.id)
        }else{
            activeId.value = 0
            mode.value = 'none'
        }
    }
    const clickHandlerBinded = clickHandler.bind(this) 
    function onPt(c:Coord){
        return saveStore.save?.points.find(p=>{
            const distSq = coordDistSq(p.pos, c)
            return distSq < clickControlPointThrsSq
        })
    }
    function translate(coordDisplayed:Coord):Coord|undefined{
        const [dx, dy] = coordDisplayed;
        const w = cvsCont.value?.offsetWidth;
        const h = cvsCont.value?.offsetHeight;
        if(!w || !h)
            return;
        const ratioX = cvsWidth.value/w
        const ratioY = cvsHeight.value/h
        return [ratioX*dx, ratioY*dy]
    }
    return { init, cvsFrame, cvsCont, activeId, cvsWidth, cvsHeight }
})