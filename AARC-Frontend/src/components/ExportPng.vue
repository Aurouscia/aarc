<script setup lang="ts">
import { ref } from 'vue';
import SideBar from './common/SideBar.vue';
import { MainCvsRenderingOptions, useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useApiStore } from '@/app/com/api';
import { useRoute } from 'vue-router';
import { editorParamNameSaveId } from '@/pages/editors/routes/routesNames';
import { useExportLocalConfigStore } from '@/app/localConfig/exportLocalConfig';
import { timeStr } from '@/utils/timeUtils/timeStr';
import { useSaveStore } from '@/models/stores/saveStore';

const sidebar = ref<InstanceType<typeof SideBar>>()
const mainCvsDispatcher = useMainCvsDispatcher()
const saveStore = useSaveStore()
const api = useApiStore().get()
const route = useRoute()
let exportLock = false

const exportLocalConfig = useExportLocalConfigStore()
async function downloadMainCvsAsPng() {
    if(exportLock)
        return
    exportLock = true

    const fileName = await getExportPngFileName()
    if(fileName){
        const mainRenderingOptions:MainCvsRenderingOptions = {
            changedLines:[],
            movedStaNames:[],
            suppressRenderedCallback:true,
            forExport:true
        }
        mainCvsDispatcher.renderMainCvs(mainRenderingOptions)
        var cvs = mainCvsDispatcher.mainCvs
        if(!cvs)
            return
        var dataURL = cvs.toDataURL('image/png');
        var link = document.createElement('a');
        link.download = fileName
        link.href = dataURL;
        link.click();

        mainRenderingOptions.forExport = false
        mainCvsDispatcher.renderMainCvs(mainRenderingOptions)
    }
    window.setTimeout(()=>{
        exportLock = false
    }, 2000)
}
async function getExportPngFileName(){
    let saveId = route.params[editorParamNameSaveId]
    if(typeof saveId === 'object')
        saveId = saveId[0] || 'err'
    const saveIdNum = parseInt(saveId)
    if(isNaN(saveIdNum))
        return `${saveId}.png`
    const info = await api.save.loadInfo(saveIdNum)
    if(info){
        let name = ''
        const style = exportPngFileNameStyle.value
        if(style == 'date')
            name = `${info.Name}-${timeStr('date')}`
        else if(style == 'dateTime')
            name = `${info.Name}-${timeStr('dateTime')}`
        else if(style == 'lineCount'){
            const lineCount = saveStore.getLineCount()
            const staCount = saveStore.getStaCount()
            name = `${info.Name}-${lineCount}线${staCount}站`
        }else{
            name = info.Name
        }
        return `${name}.png`
    }
}
const exportPngFileNameStyle = ref<string>()
exportPngFileNameStyle.value = exportLocalConfig.readExportFileNameStyle() || 'plain'
function exportPngFileNameStyleChanged(){
    exportLocalConfig.saveExportFileNameStyle(exportPngFileNameStyle.value || 'plain')
}

defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
</script>

<template>
<SideBar ref="sidebar">
<h1>导出作品</h1>
<div class="exportOps">
    <div class="configSelect">
        <div style="color: #666;">文件名</div>
        <select v-model="exportPngFileNameStyle" @change="exportPngFileNameStyleChanged">
            <option :value="'plain'">存档名</option>
            <option :value="'date'">日期</option>
            <option :value="'dateTime'">日期时间</option>
            <option :value="'lineCount'">线路站点</option>
        </select>
    </div>
    <button @click="downloadMainCvsAsPng" class="ok">导出为png格式</button>
    <div class="note">
        作品导出设置（清晰度等）将后续推出<br/>
        当前“站点数”不准确，正在修复
    </div>
</div>
</SideBar>
</template>

<style scoped lang="scss">
.configSelect{
    display: flex;
    align-items: center;
}
.exportOps{
    display: flex;
    flex-direction: column;
    align-items: center;
}
.note{
    margin-top: 30px;
    font-size: 14px;
    color: #999;
    text-align: center;
}
</style>