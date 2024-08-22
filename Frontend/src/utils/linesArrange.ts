import { useSaveStore } from "@/models/stores/saveStore";
import { ref } from "vue";

export function useLinesArrange(unit:number){
    const saveStore = useSaveStore()
    const activeId = ref<number>(-1)
    let activeOriginalY:number = -1
    function mouseDownLineArrange(e:MouseEvent, id:number){
        const y = e.pageY
        activeId.value = id;
        activeOriginalY = y;
    }
    function registerLinesArrange(){
        window.addEventListener('mousemove', mouseMoveHandler)
        window.addEventListener('mouseup', mouseUpHandler)
        console.log("已注册线路调序事件")
    }
    function disposeLinesArrange(){
        window.removeEventListener('mousemove', mouseMoveHandler)
        window.removeEventListener('mouseup', mouseUpHandler)
        console.log("已移除线路调序事件")
    }
    function mouseMoveHandler(e:MouseEvent){
        if(activeId.value == -1)
            return;
        const y = e.pageY
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
    function mouseUpHandler(e:MouseEvent){
        activeId.value = -1;
    }
    return { mouseDownLineArrange, registerLinesArrange, disposeLinesArrange, activeId }
}