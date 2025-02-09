<script setup lang="ts">
import { ref } from 'vue';
import SideBar from '../common/SideBar.vue';
import { MainCvsRenderingOptions, useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useApiStore } from '@/app/com/api';
import { useRoute } from 'vue-router';
import { editorParamNameSaveId } from '@/pages/editors/routes/routesNames';
import { useExportLocalConfigStore } from '@/app/localConfig/exportLocalConfig';
import { timeStr } from '@/utils/timeUtils/timeStr';
import { useSaveStore } from '@/models/stores/saveStore';
import { CvsBlock, CvsContext } from '@/models/cvs/common/cvsContext';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { AdsRenderType } from '@/models/cvs/workers/adsCvsWorker';
import { useMiniatureCvsDispatcher } from '@/models/cvs/dispatchers/miniatureCvsDispatcher';

const sidebar = ref<InstanceType<typeof SideBar>>()
const mainCvsDispatcher = useMainCvsDispatcher()
const miniatureCvsDispatcher = useMiniatureCvsDispatcher()
const saveStore = useSaveStore()
const api = useApiStore().get()
const route = useRoute()
const { pop } = useUniqueComponentsStore()
let exportLock = false

const exportLocalConfig = useExportLocalConfigStore()
async function downloadMainCvsAsPng() {
    if(exportLock)
        return
    exportLock = true

    const fileName = await getExportPngFileName()
    if(fileName){
        const cvs = new OffscreenCanvas(saveStore.cvsWidth, saveStore.cvsHeight)
        const ctx2d = cvs.getContext('2d')!
        const ctx = new CvsContext([new CvsBlock(1, 0, 0, ctx2d)])
        const mainRenderingOptions:MainCvsRenderingOptions = {
            changedLines:[],
            movedStaNames:[],
            suppressRenderedCallback:true,
            forExport:true,
            ctx,
            withAds: exportWithAds.value as AdsRenderType|undefined
        }
        mainCvsDispatcher.renderMainCvs(mainRenderingOptions)

        const pngDataUrl = await cvsToDataUrl(cvs)
        if(!pngDataUrl){
            return
        }
        var link = document.createElement('a');
        link.download = fileName
        link.href = pngDataUrl;
        link.click();

        mainRenderingOptions.forExport = false
        mainCvsDispatcher.renderMainCvs(mainRenderingOptions)
    }
    window.setTimeout(()=>{
        exportLock = false
    }, 2000)
}
async function downloadMiniatureCvsAsPng() {
    if(exportLock)
        return
    exportLock = true
    const fileName = await getExportPngFileName(true)
    if(fileName){
        const cvs = miniatureCvsDispatcher.renderMiniatureCvs(256, 2)
        const pngDataUrl = await cvsToDataUrl(cvs)
        if(!pngDataUrl){
            return
        }
        var link = document.createElement('a');
        link.download = fileName
        link.href = pngDataUrl;
        link.click();
    }
    window.setTimeout(()=>{
        exportLock = false
    }, 1000)
}
async function getExportPngFileName(isMini?:boolean){
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
        if(isMini){
            name = `${name}-mini`
        }
        return `${name}.png`
    }
}
const exportPngFileNameStyle = ref<string>()
exportPngFileNameStyle.value = exportLocalConfig.readExportFileNameStyle() || 'plain'
function exportPngFileNameStyleChanged(){
    exportLocalConfig.saveExportFileNameStyle(exportPngFileNameStyle.value || 'plain')
}
async function cvsToDataUrl(cvs:OffscreenCanvas):Promise<string>{
    return await cvs.convertToBlob({ type: 'image/png' }).then(blob => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                if(typeof reader.result =='string')
                    resolve(reader.result)
                else
                    resolve('')
            };
            reader.readAsDataURL(blob);
        });
    })
}

const exportWithAds = ref<AdsRenderType>()
exportWithAds.value = (exportLocalConfig.readExportWithAds() || 'no') as AdsRenderType
function exportWithAdsChanged(){
    exportLocalConfig.saveExportWithAds(exportWithAds.value || 'no')
    if(exportWithAds.value && exportWithAds.value !== 'no'){
        pop?.show('感谢支持', 'success')
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
    <div class="configSelect">
        <div style="color: #666;">文件名</div>
        <select v-model="exportPngFileNameStyle" @change="exportPngFileNameStyleChanged">
            <option :value="'plain'">存档名</option>
            <option :value="'date'">日期</option>
            <option :value="'dateTime'">日期时间</option>
            <option :value="'lineCount'">线路站点</option>
        </select>
    </div>
    <div class="configSelect">
        <div style="color: #666;">宣传水印</div>
        <select v-model="exportWithAds" @change="exportWithAdsChanged">
            <option :value="'no'">无</option>
            <option :value="'less'">简略</option>
            <option :value="'more'">详细</option>
        </select>
    </div>
    <button @click="downloadMainCvsAsPng" class="ok">导出为图片</button>
    <button @click="downloadMiniatureCvsAsPng" class="minor">导出为缩略图</button>
    <div class="note">
        点击后请耐心等待数秒，不要反复点击<br/>
    </div>
    <div class="note">
        作品导出设置（清晰度等）将后续推出<br/>
        当前“站点数”不准确，正在修复
    </div>
</div>
</SideBar>
</template>

<style scoped lang="scss">
.ok{
    margin-top: 20px;
}
.configSelect{
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.exportOps{
    display: flex;
    flex-direction: column;
    align-items: stretch;
}
.note{
    margin-top: 30px;
    font-size: 14px;
    color: #999;
    text-align: center;
}
</style>