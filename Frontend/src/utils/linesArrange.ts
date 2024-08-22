import { useSaveStore } from "@/models/stores/saveStore";
import { ref } from "vue";

export function useLinesArrange(unit:number){
    const saveStore = useSaveStore()
    const activeId = ref<number>(-1)
    let activeOriginalY:number = -1
    function mouseDownLineArrange(e:MouseEvent|TouchEvent, id:number){
        e.preventDefault()
        const y = getY(e)
        console.log(y)
        activeId.value = id;
        activeOriginalY = y;
    }
    function registerLinesArrange(){
        window.addEventListener('mousemove', mouseMoveHandler)
        window.addEventListener('touchmove', mouseMoveHandler)
        window.addEventListener('mouseup', mouseUpHandler)
        window.addEventListener('touchend', mouseUpHandler)
        console.log("已注册线路调序事件")
    }
    function disposeLinesArrange(){
        window.removeEventListener('mousemove', mouseMoveHandler)
        window.removeEventListener('touchmove', mouseMoveHandler)
        window.removeEventListener('mouseup', mouseUpHandler)
        window.removeEventListener('touchend', mouseUpHandler)
        console.log("已移除线路调序事件")
    }
    function mouseMoveHandler(e:MouseEvent|TouchEvent){
        if(activeId.value == -1)
            return;
        const y = getY(e)
        if(y < 0)
            return;
        let diff = y - activeOriginalY
        let move = 0;
        if(diff > unit)
            move = 1
        else if(diff < -unit)
            move = -1
        if(move != 0 && saveStore.save){
            const idx = saveStore.save.lines.findIndex(x=>x.id == activeId.value)
            if(idx==-1)
                return;
            const item = saveStore.save.lines.splice(idx, 1)
            saveStore.save.lines.splice(idx+move, 0, ...item)
            activeOriginalY = y
        }
    }
    function mouseUpHandler(){
        activeId.value = -1;
    }
    function getY(e:MouseEvent|TouchEvent){
        if('pageY' in e)
            return e.pageY
        else{
            if(e.touches.length<1){
                return -1
            }
            return e.touches[0].pageY
        }
    }

    return { mouseDownLineArrange, registerLinesArrange, disposeLinesArrange, activeId }
}