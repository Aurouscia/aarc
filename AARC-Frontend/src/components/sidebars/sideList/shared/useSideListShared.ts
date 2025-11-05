import { useMainCvsDispatcher } from "@/models/cvs/dispatchers/mainCvsDispatcher"
import { Line, LineType } from "@/models/save"
import { useEnvStore } from "@/models/stores/envStore"
import { useSaveStore } from "@/models/stores/saveStore"
import { useLinesArrange } from "@/utils/eventUtils/linesArrange"
import SideBar from "@/components/common/SideBar.vue"
import { computed, ref } from "vue"
import LineOptions from "../../options/LineOptions.vue"
import Lines from "../Lines.vue"
import { useUniqueComponentsStore } from "@/app/globalStores/uniqueComponents"
import { useOptionsOpenerStore } from "@/models/stores/utils/optionsOpenerStore"
import { storeToRefs } from "pinia"

export function useSideListShared(lineType:LineType){
    const saveStore = useSaveStore()
    const envStore = useEnvStore()
    const mainCvsDispatcher = useMainCvsDispatcher()
    const sidebar = ref<InstanceType<typeof SideBar>>()
    const { pop } = useUniqueComponentsStore()
    const showingLineGroup = ref<number>()
    const showingChildrenOf = ref<number>()
    const showingChildrenOfInfo = computed<{name?:string,color?:string}>(()=>{
        if(!showingChildrenOf.value) return {}
        const parent = saveStore.getLineById(showingChildrenOf.value)
        if(!parent) return {}
        const name = parent.name 
        const color = saveStore.getLineActualColor(parent)
        return {name, color}
    })
    const lines = computed<Line[]>(()=>{
        const filteringParent = !!showingChildrenOf.value
        const filterParent = (x:Line)=>{
            if(!filteringParent)
                return !x.parent
            return showingChildrenOf.value === x.parent
        }
        const filterGroup = (x:Line)=>{
            if(filteringParent)
                return true
            return showingLineGroup.value === x.group
        }
        return saveStore.save?.lines.filter(x =>
            x.type===lineType
            && filterGroup(x)
            && filterParent(x)
        ) || []
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
        envStore.createLine(lineType, showingLineGroup.value, showingChildrenOf.value)
    }
    function delLine(line:Line, withSta:boolean){
        envStore.delLine(line.id, false, withSta)
    }

    const editingInfoLine = ref<Line>()
    function editInfoOfLine(line:Line){
        editingInfoLine.value = line
        window.setTimeout(()=>{
            lineOptions.value?.open()
        },1)
    }
    
    const wantDelLine = ref<Line>()
    function delLineStart(l:Line){
        if(saveStore.getLinesByParent(l.id)?.length){
            pop?.show('先删除或移出其所有支线', 'failed')
            return
        }
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

    function autoInitShowingGroup(){
        const thisTypeLines = saveStore.getLinesByType(lineType)
        //计算每个组的线路数量
        const groupSize = new Map<number, number>()
        thisTypeLines.forEach(x=>{
            if(x.parent)
                return //支线不算数
            const xGroup = x.group ?? 0
            const size = groupSize.get(xGroup) || 0
            groupSize.set(xGroup, size+1)
        })
        //将线路数量最多的组设为当前显示的
        let maxSize = 0
        for(const e of groupSize.entries()){
            if(e[1]>maxSize){
                maxSize = e[1]
                showingLineGroup.value = e[0]
            }
        }
        //若为0，将其设为undefined（默认分组）
        if(!showingLineGroup.value)
            showingLineGroup.value = undefined
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

    const showingBtns = ref<'children'|'arrange'>('arrange')
    const childrenLines = ref<InstanceType<typeof Lines>>()
    function showChildrenOf(line?:Line){
        if(!line)
            childrenLines.value?.fold()
        else
            childrenLines.value?.comeOut(line.id)
    }
    function leaveParent(line:Line){
        if(window.confirm(`确认拆分<${line.name||'无名支线'}>为单独线路`)){
            line.parent = undefined
            saveStore.ensureLinesOrdered()
            envStore.rerender([], [])
        }
    }


    function showListSidebar(parentLineId?:number){
        showingChildrenOf.value = parentLineId
        sidebar.value?.extend()
    }
    function hideListSidebar(){
        childrenLines.value?.fold()
        sidebar.value?.fold()
        lineOptions.value?.fold()
    }

    const optionsOpener = storeToRefs(useOptionsOpenerStore())
    if(lineType===LineType.common){
        optionsOpener.openOptionsForCommonLine.value = openOptions
    }else if(lineType===LineType.terrain){
        optionsOpener.openOptionsForTerrainLine.value = openOptions
    }
    function openOptions(lineId?:number){
        if(!lineId)
            return
        let line = saveStore.getLineById(lineId)
        if(!line)
            return
        editInfoOfLine(line)
    }

    return {
        sidebar, lineOptions, lines, envStore, saveStore,
        registerLinesArrange, disposeLinesArrange, mouseDownLineArrange,
        arrangingId, editingInfoLine, editInfoOfLine,
        createLine, 
        wantDelLine, delLineStart, delLineAbort, delLineExe,
        showingLineGroup, lineGroupCheck, lineGroupsSelectable, autoInitShowingGroup,
        showingBtns, showingChildrenOfInfo,
        showChildrenOf, leaveParent, childrenLines,
        showListSidebar, hideListSidebar
    }
}