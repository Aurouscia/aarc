import { useMainCvsDispatcher } from "@/models/cvs/dispatchers/mainCvsDispatcher"
import { Line, LineType } from "@/models/save"
import { useEnvStore } from "@/models/stores/envStore"
import { useSaveStore } from "@/models/stores/saveStore"
import { useLinesArrange } from "@/utils/eventUtils/linesArrange"
import SideBar from "@/components/common/SideBar.vue"
import { ref } from "vue"

export function useSideListShared(lineType:LineType, lineTypeCalled:string){
    const saveStore = useSaveStore()
    const envStore = useEnvStore()
    const mainCvsDispatcher = useMainCvsDispatcher()
    const sidebar = ref<InstanceType<typeof SideBar>>()
    const lines = ref<Line[]>([])
    const {
        registerLinesArrange, disposeLinesArrange, mouseDownLineArrange, activeId: arrangingId
    } = useLinesArrange(65, lines, orderChanged) //65：一个线路框60高，加上5的缝隙

    let orderChangeRerenderTimer = 0
    function orderChanged(){
        const orderedIds = lines.value.map(x=>x.id)
        saveStore.arrangeLinesOfType(orderedIds, lineType)
        window.clearTimeout(orderChangeRerenderTimer)
        orderChangeRerenderTimer = window.setTimeout(()=>{
            mainCvsDispatcher.renderMainCvs({
                changedLines:[],
                movedStaNames:[]
            })
        }, 500)
    }
    function createLine(){
        envStore.createLine(lineType)
        init()
    }
    function delLine(line:Line){
        if(window.confirm(`确定删除${lineTypeCalled}"${line.name}"？`)){
            envStore.delLine(line.id)
            init()
        }
    }
    function init(){
        lines.value = saveStore.getLinesByType(lineType)
    }

    const editingInfoLineId = ref<number>()
    function editInfoOfLine(lineId:number){
        if(lineId!==editingInfoLineId.value){
            window.setTimeout(()=>{
                editingInfoLineId.value = lineId
            },1)
        }else{
            editingInfoLineId.value = undefined
        }
    }

    return {
        sidebar, lines, init, envStore, saveStore,
        registerLinesArrange, disposeLinesArrange, mouseDownLineArrange,
        arrangingId, editingInfoLineId, editInfoOfLine,
        createLine, delLine
    }
}