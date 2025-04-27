import { useMainCvsDispatcher } from "@/models/cvs/dispatchers/mainCvsDispatcher"
import { Line, LineType } from "@/models/save"
import { useEnvStore } from "@/models/stores/envStore"
import { useSaveStore } from "@/models/stores/saveStore"
import { useLinesArrange } from "@/utils/eventUtils/linesArrange"
import SideBar from "@/components/common/SideBar.vue"
import { computed, ref } from "vue"
import LineOptions from "../../options/LineOptions.vue"

export function useSideListShared(lineType:LineType, _lineTypeCalled:string){
    const saveStore = useSaveStore()
    const envStore = useEnvStore()
    const mainCvsDispatcher = useMainCvsDispatcher()
    const sidebar = ref<InstanceType<typeof SideBar>>()
    const showingLineGroup = ref<number>()
    const lines = computed<Line[]>(()=>{
        return saveStore.save?.lines.filter(x => x.type===lineType && x.group===showingLineGroup.value) || []
    })
    const lineOptions = ref<InstanceType<typeof LineOptions>>()
    const lineGroupsSelectable = computed(()=>{
        return saveStore.save?.lineGroups?.filter(x=>x.lineType===lineType) || [] 
    })
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
        envStore.createLine(lineType, showingLineGroup.value)
    }
    function delLine(line:Line, withSta:boolean){
        envStore.delLine(line.id, false, withSta)
    }

    const editingInfoLine = ref<Line>()
    function editInfoOfLine(line:Line){
        console.log(line)
        editingInfoLine.value = line
        window.setTimeout(()=>{
            console.log(editingInfoLine.value)
            console.log(lineOptions.value)
            lineOptions.value?.open()
        },1)
    }

    const wantDelLine = ref<Line>()
    function delLineStart(l:Line){
        wantDelLine.value = l
    }
    function delLineAbort(){
        wantDelLine.value = undefined
    }
    function delLineExe(withSta:boolean){
        if(wantDelLine.value){
            delLine(wantDelLine.value, withSta)
            wantDelLine.value = undefined
        }
    }

    function lineGroupCheck(){
        //若有线路组被删除，将其线路的group属性设为undefined
        //若当前显示的线路组被删除，将其设为undefined
        const existGroupIds = saveStore.save?.lineGroups
            ?.filter(x=>x.lineType===lineType)
            .map(x=>x.id) || [];
        if(showingLineGroup.value && !existGroupIds.includes(showingLineGroup.value)){
            showingLineGroup.value = undefined; 
        }
        const linesOfType = saveStore.getLinesByType(lineType)
        linesOfType.forEach(x=>{
            if(x.group && !existGroupIds.includes(x.group)){
                x.group = undefined;
            }
        })
    }

    return {
        sidebar, lineOptions, lines, envStore, saveStore,
        registerLinesArrange, disposeLinesArrange, mouseDownLineArrange,
        arrangingId, editingInfoLine, editInfoOfLine,
        createLine, 
        wantDelLine, delLineStart, delLineAbort, delLineExe,
        showingLineGroup, lineGroupCheck, lineGroupsSelectable
    }
}