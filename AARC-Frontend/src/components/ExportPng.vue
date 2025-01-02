<script setup lang="ts">
import { ref } from 'vue';
import SideBar from './common/SideBar.vue';
import { MainCvsRenderingOptions, useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useApiStore } from '@/app/com/api';
import { useRoute } from 'vue-router';
import { editorParamNameSaveId } from '@/pages/editors/routes/routesNames';

const sidebar = ref<InstanceType<typeof SideBar>>()
const mainCvsDispatcher = useMainCvsDispatcher()
const api = useApiStore().get()
const route = useRoute()
let exportLock = false

async function downloadMainCvsAsPng() {
    if(exportLock)
        return
    exportLock = true

    const fileName = await getFileName()
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
async function getFileName(){
    let saveId = route.params[editorParamNameSaveId]
    if(typeof saveId === 'object')
        saveId = saveId[0] || 'err'
    const saveIdNum = parseInt(saveId)
    if(isNaN(saveIdNum))
        return `${saveId}.png`
    const info = await api.save.loadInfo(saveIdNum)
    if(info){
        return `${info.Name}.png`
    }
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
    <button @click="downloadMainCvsAsPng" class="ok">导出为png格式</button>
    <div class="note">
        作品导出设置（清晰度等）将后续推出
    </div>
</div>
</SideBar>
</template>

<style scoped lang="scss">
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