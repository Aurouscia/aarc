<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import SideBar from '../common/SideBar.vue';
import { MainCvsRenderingOptions, useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useApiStore } from '@/app/com/apiStore';
import { useRoute } from 'vue-router';
import { editorParamNameSaveId } from '@/pages/editors/routes/routesNames';
import { useExportLocalConfigStore } from '@/app/localConfig/exportLocalConfig';
import { timeStr } from '@/utils/timeUtils/timeStr';
import { useSaveStore } from '@/models/stores/saveStore';
import { CvsBlock, CvsContext } from '@/models/cvs/common/cvsContext';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useMiniatureCvsDispatcher } from '@/models/cvs/dispatchers/miniatureCvsDispatcher';
import { disableContextMenu, enableContextMenu } from '@/utils/eventUtils/contextMenu';
import { useBrowserInfoStore } from '@/app/globalStores/browserInfo';
import Notice from '../common/Notice.vue';
import ExportWatermarkConfig from './configs/ExportWatermarkConfig.vue';
import ConfigSection from './configs/shared/ConfigSection.vue';
import { storeToRefs } from 'pinia';

const sidebar = ref<InstanceType<typeof SideBar>>()
const mainCvsDispatcher = useMainCvsDispatcher()
const miniatureCvsDispatcher = useMiniatureCvsDispatcher()
const saveStore = useSaveStore()
const api = useApiStore()
const route = useRoute()
const { pop } = useUniqueComponentsStore()
const exported = ref<boolean>(false)
const exporting = ref<boolean>(false)

const exportLocalConfig = useExportLocalConfigStore()
const { fileNameStyle, pixelRestrict, ads } = storeToRefs(exportLocalConfig)
async function downloadMainCvsAsPng() {
    if(exporting.value)
        return
    exported.value = false
    exporting.value = true

    const fileName = await getExportPngFileName()
    if(fileName){
        const { scale, cvsWidth, cvsHeight } = getExportRenderSize()
        const cvs = new OffscreenCanvas(cvsWidth, cvsHeight)
        const ctx2d = cvs.getContext('2d')!
        const ctx = new CvsContext([new CvsBlock(scale, 0, 0, ctx2d)])
        const mainRenderingOptions:MainCvsRenderingOptions = {
            changedLines:[],
            movedStaNames:[],
            suppressRenderedCallback:true,
            forExport:true,
            ctx,
            withAds: ads.value
        }
        mainCvsDispatcher.renderMainCvs(mainRenderingOptions)

        const pngDataUrl = await cvsToDataUrl(cvs)
        if(!pngDataUrl){
            return
        }
        var link = getDownloadAnchor()
        if(link && 'href' in link){
            exported.value = true
            link.href = pngDataUrl;
            if('download' in link)
                link.download = fileName
            link.click();
        }

        mainRenderingOptions.forExport = false
        mainCvsDispatcher.renderMainCvs(mainRenderingOptions)
    }
    exporting.value = false
}
let activeUrl:string|undefined = undefined;
async function downloadMiniatureCvsAsPng() {
    if(exporting.value)
        return
    exported.value = false
    exporting.value = true
    const fileName = await getExportPngFileName(true)
    if(fileName){
        if(activeUrl)
            URL.revokeObjectURL(activeUrl)
        const cvs = miniatureCvsDispatcher.renderMiniatureCvs(256, 2)
        activeUrl = await cvsToDataUrl(cvs)
        if(!activeUrl){
            return
        }
        var link = getDownloadAnchor()
        if(link && 'href' in link){
            exported.value = true
            link.href = activeUrl;
            if('download' in link)
                link.download = fileName
            link.click();
        }
    }
    exporting.value = false
}
async function getExportPngFileName(isMini?:boolean){
    let saveId = route.params[editorParamNameSaveId]
    if(typeof saveId === 'object')
        saveId = saveId[0] || 'err'
    const saveIdNum = parseInt(saveId)
    let saveName:string
    if(isNaN(saveIdNum))
        saveName = saveId
    else{
        const info = await api.save.loadInfo(saveIdNum)
        saveName = info?.name ?? '??'
    }
    let name = ''
    const style = fileNameStyle.value
    if (style == 'date')
        name = `${saveName}-${timeStr('date')}`
    else if (style == 'dateTime')
        name = `${saveName}-${timeStr('dateTime')}`
    else if (style == 'lineCount') {
        const lineCount = saveStore.getLineCount()
        const staCount = saveStore.getStaCount()
        name = `${saveName}-${lineCount}线${staCount}站`
    } else {
        name = saveName ?? '未命名'
    }
    if (isMini) {
        name = `${name}-mini`
    }
    return `${name}.png`
}
function getExportRenderSize():{scale:number, cvsWidth:number, cvsHeight:number}{
    const epr = Number(pixelRestrict.value||'')
    const asIs = ()=>{
        return{
            scale:1,
            cvsWidth:saveStore.cvsWidth,
            cvsHeight:saveStore.cvsHeight
        }
    }
    if(isNaN(epr) || epr<=100){
        return asIs()
    }
    const biggerSide = Math.max(saveStore.cvsWidth, saveStore.cvsHeight)
    if(biggerSide <= epr)
        return asIs()
    const scale = epr/biggerSide
    return {
        scale,
        cvsWidth: saveStore.cvsWidth*scale,
        cvsHeight: saveStore.cvsHeight*scale
    }
}
async function cvsToDataUrl(cvs:OffscreenCanvas):Promise<string>{
    const blob = await cvs.convertToBlob({ type: 'image/png' });
    return URL.createObjectURL(blob);
}

const downloadAnchorElementId = 'downloadAnchor'
function getDownloadAnchor(){
    return document.getElementById(downloadAnchorElementId)
}

watch(ads, ()=>{
    if(ads.value && ads.value !== 'no'){
        pop?.show('感谢支持', 'success')
    }
})

const { isWebkit } = useBrowserInfoStore()

defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})

onMounted(()=>{
    exportLocalConfig.backCompat()
})
</script>

<template>
<SideBar ref="sidebar" @extend="enableContextMenu()" @fold="disableContextMenu();exported=false">
<h1>导出作品</h1>
<div class="exportOps">
    <div class="configItem">
        <div class="itemName">文件名</div>
        <select v-model="fileNameStyle">
            <option :value="'plain'">存档名</option>
            <option :value="'date'">日期</option>
            <option :value="'dateTime'">日期时间</option>
            <option :value="'lineCount'">线路站点</option>
        </select>
    </div>
    <div class="configItem">
        <div class="itemName">像素上限</div>
        <input v-model="pixelRestrict" type="number"/>
    </div>
    <div class="configItem">
        <div class="itemName">宣传水印</div>
        <select v-model="ads">
            <option :value="'no'">无</option>
            <option :value="'less'">简略</option>
            <option :value="'more'">详细</option>
        </select>
    </div>
    <button @click="downloadMainCvsAsPng" class="ok">导出为图片</button>
    <button @click="downloadMiniatureCvsAsPng" class="minor">导出为缩略图</button>
    <div v-show="exported" class="note">
        若点击导出后没有开始下载<br/>请尝试<a :id="downloadAnchorElementId" class="downloadAnchor">点击此处</a>
    </div>
    <Notice v-show="exporting" :title="'请等待'" :type="'info'">
        正在导出，可能需要几秒
    </Notice>
    <div v-show="exported" class="note">
        若导出失败，可能由于系统/浏览器限制，<br/>
        导致只能导出更模糊的图片<br/>
        请尝试设置<b>“像素上限”</b>为{{ isWebkit ? '4000': '19000' }}，若仍然失败则逐步调低直至导出成功<br/>
        若需要清晰的图片请换用其他设备/浏览器
    </div>
    <div class="exportConfigs">
        <ExportWatermarkConfig></ExportWatermarkConfig>
        <ConfigSection :title="'已知的浏览器限制'">
            <table class="fullWidth"><tbody>
                <tr>
                    <th>浏览器</th>
                    <th>导出像素上限</th>
                </tr>
                <tr>
                    <td>Chrome/Edge</td>
                    <td>19000</td>
                </tr>
                <tr>
                    <td>苹果系统上<br/>任意浏览器</td>
                    <td>4000</td>
                </tr>
                <tr>
                    <td>FireFox(PC版)</td>
                    <td>暂未发现限制</td>
                </tr>
                <tr>
                    <td colspan="2" class="smallNote">欢迎向我们反馈更多</td>
                </tr>
            </tbody></table>
        </ConfigSection>
    </div>
</div>
</SideBar>
</template>

<style scoped lang="scss">
.ok{
    margin-top: 20px;
}
.configItem{
    display: flex;
    align-items: center;
    justify-content: space-between;
    .itemName{
        color:#666;
    }
    input{
        max-width: 120px;
    }
}
.explainItem{
    color: #333;
    font-size: 14px;
}
.exportOps{
    display: flex;
    flex-direction: column;
    align-items: stretch;
}
.note{
    margin-top: 30px;
    margin-bottom: 10px;
    font-size: 14px;
    color: #999;
    text-align: center;
    .downloadAnchor{
        color: cornflowerblue;
        text-decoration: underline;
    }
}
</style>