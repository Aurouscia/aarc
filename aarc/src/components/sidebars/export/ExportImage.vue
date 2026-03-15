<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from 'vue';
import SideBar from '../../common/SideBar.vue';
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
import Notice from '../../common/Notice.vue';
import ExportWatermarkConfig from '../configs/ExportWatermarkConfig.vue';
import ConfigSection from '../configs/shared/ConfigSection.vue';
import ExportInfo from './ExportInfo.vue'
import { storeToRefs } from 'pinia';
import { useBrowserInfoStore } from '@/app/globalStores/browserInfo';
import ExportAccentuationConfig from '../configs/ExportAccentuationConfig.vue';
import { useRenderOptionsStore } from '@/models/stores/renderOptionsStore';
import ExportEtcConfig from '../configs/ExportEtcConfig.vue';
import ExportTimeConfig from '../configs/ExportTimeConfig.vue';
import Prompt from '../../common/Prompt.vue';
import { useImageExport } from './composables/useImageExport';
import { useApngExport } from './composables/useApngExport';

const sidebar = useTemplateRef('sidebar')
const mainCvsDispatcher = useMainCvsDispatcher()
const miniatureCvsDispatcher = useMiniatureCvsDispatcher()
const saveStore = useSaveStore()
const api = useApiStore()
const { isWindows } = storeToRefs(useBrowserInfoStore())
const route = useRoute()
const { showPop } = useUniqueComponentsStore()

const renderOptionsStore = useRenderOptionsStore()
const exportLocalConfig = useExportLocalConfigStore()
const { 
    fileNameStyle, fileFormat, fileQuality, pixelRestrict, pixelRestrictMode, ads, bgRefImage
} = storeToRefs(exportLocalConfig)

// 使用 composables
const { 
    exporting, 
    exported, 
    exportFailedMsg, 
    downloadAnchorElementId,
    canEncodeWebP,
    cvsToDataUrl,
    triggerDownload,
    startExport,
    finishExport,
    setExportFailed
} = useImageExport()

const {
    exporting: apngExporting,
    exported: apngExported,
    exportFailedMsg: apngExportFailedMsg,
    exportApng
} = useApngExport()

async function downloadMainCvsAsImage() {
    if(exporting.value)
        return
    if(fileFormat.value == 'jpeg' && renderOptionsStore.bgOpacity < 1){
        showPop('jpg不支持背景透明\n请改用其他格式', 'failed')
        return
    }
    startExport()

    const fileName = await getExportImageFileName()
    if(fileName){
        const { scale, cvsWidth, cvsHeight } = getExportRenderSize()
        const cvs = new OffscreenCanvas(cvsWidth, cvsHeight)
        const ctx2d = cvs.getContext('2d')!
        const ctx = new CvsContext(new CvsBlock(scale, 0, 0, ctx2d))
        const mainRenderingOptions:MainCvsRenderingOptions = {
            movedStaNames:[],
            suppressRenderedCallback:true,
            ctx,
            withAds: ads.value,
            withBgRefImage: bgRefImage.value
        }
        renderOptionsStore.exporting = true; // 启用导出模式
        mainCvsDispatcher.renderMainCvs(mainRenderingOptions)

        let imageDataUrl
        try{
            imageDataUrl = await cvsToDataUrl(cvs, fileFormat.value, fileQuality.value)
        }
        catch(e){
            console.error(e)
            showPop('导出失败\n请查看指引', 'failed')
            setExportFailed('可能是浏览器像素上限，请查看指引')
            return
        }
        if(!imageDataUrl){
            return
        }
        triggerDownload(imageDataUrl, fileName)

        renderOptionsStore.exporting = false; // 复位导出模式
    }
    finishExport()
}
let activeUrl:string|undefined = undefined;
async function downloadMiniatureCvsAsImage() {
    if(exporting.value)
        return
    startExport()
    const fileName = await getExportImageFileName(true)
    if(fileName){
        if(activeUrl)
            URL.revokeObjectURL(activeUrl)
        const cvs = miniatureCvsDispatcher.renderMiniatureCvs(256, 2)
        activeUrl = await cvsToDataUrl(cvs, fileFormat.value, fileQuality.value)
        if(!activeUrl){
            return
        }
        triggerDownload(activeUrl, fileName)
    }
    finishExport()
}


/**
 * 导出 APNG 动图
 */
async function downloadMiniatureApng() {
    if(apngExporting.value)
        return
    
    const fileName = await getExportImageFileName(true)
    if(!fileName){
        return
    }

    await exportApng({ fileName })
}

async function getExportImageFileName(isMini?:boolean){
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
    return `${name}.${fileFormat.value}`
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
    if(biggerSide <= epr && pixelRestrictMode.value=='max')
        return asIs()
    const scale = epr/biggerSide
    return {
        scale,
        cvsWidth: saveStore.cvsWidth*scale,
        cvsHeight: saveStore.cvsHeight*scale
    }
}

watch(ads, ()=>{
    if(ads.value && ads.value !== 'no'){
        showPop('感谢支持', 'success')
    }
})

defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})

function explainPixelMode(){
    window.alert('选择“指定”模式后，将严格按“像素”的值进行导出，“像素”值较大时可获得高清图片')
}
function explainFileFormat(){
    window.alert('png文件较大（但兼容性好且无损），webp文件较小且可以设置画质（但老设备可能无法查看），jpg建议不要用；敬请期待svg导出功能')
}

onMounted(()=>{
    // 如果浏览器不支持webp，自动改为png
    if(!canEncodeWebP()){
        if(fileFormat.value == 'webp'){
            fileFormat.value = 'png'
        }
    }
})

// 同步 apng 导出状态到组件
watch(apngExporting, (val) => {
    exporting.value = val
})
watch(apngExported, (val) => {
    exported.value = val
})
watch(apngExportFailedMsg, (val) => {
    exportFailedMsg.value = val
})

const showApngExportNotice = ref(false)
</script>

<template>
    <SideBar ref="sidebar" @extend="enableContextMenu()" @fold="disableContextMenu();exported=false;exportFailedMsg=false">
        <div class="exportOps">
            <div class="configItem">
                <div class="itemName">文件名</div>
                <select v-model="fileNameStyle">
                    <option :value="'plain'">仅存档名</option>
                    <option :value="'date'">日期</option>
                    <option :value="'dateTime'">日期时间</option>
                    <option :value="'lineCount'">线路站点</option>
                </select>
            </div>
            <div class="configItem">
                <div class="itemName">长边像素</div>
                <input v-model="pixelRestrict" type="number" placeholder='参考"已知限制"'/>
            </div>
            <div class="configItem">
                <div class="itemName">
                    像素模式
                    <!--TODO：删除它，改为使用统一的自定义alert组件-->
                    <div class="questionMark" @click="explainPixelMode">?</div>
                </div>
                <select v-model="pixelRestrictMode">
                    <option :value="'max'">上限</option>
                    <option :value="'exact'">指定</option>
                </select>
            </div>
            <div class="configItem">
                <div class="itemName">
                    图片格式
                    <!--TODO：删除它，改为使用统一的自定义alert组件-->
                    <div class="questionMark" @click="explainFileFormat">?</div>
                </div>
                <select v-model="fileFormat">
                    <option :value="'png'">PNG(不推荐)</option>
                    <option :value="'webp'">WEBP</option>
                    <option :value="'jpeg'">JPG(不推荐)</option>
                </select>
            </div>
            <div class="configItem" v-if="fileFormat!='png'">
                <div class="itemName">图片质量</div>
                <div>
                    <input v-model.number="fileQuality" type="range" :min="0" :max="1" :step="0.01"/>
                    <div class="rangeDisplay">{{ fileQuality?.toFixed(2) }}</div>
                </div>
            </div>
            <div class="configItem">
                <div class="itemName">宣传水印</div>
                <select v-model="ads">
                    <option :value="'no'">无</option>
                    <option :value="'less'">简略</option>
                    <option :value="'more'">详细</option>
                </select>
            </div>
            <button @click="downloadMainCvsAsImage" class="ok">导出为图片</button>
            <button @click="downloadMiniatureCvsAsImage" class="minor">导出为缩略图</button>
            <button @click="downloadMiniatureApng" class="minor">导出发展史动图（试验）</button>
            <div v-show="!exported" class="note apng-notice-entry" @click="showApngExportNotice=true">
                试验功能有关注意事项
            </div>
            <Prompt v-if="showApngExportNotice" @close="showApngExportNotice=false" :bg-click-close="true">
                <p>请先为每条线路设置“开通时间”，才能使用本功能。</p><br/>
                <p>本功能导出的是 APNG 格式（后缀名和 png 一样），仅在部分软件中能呈现动态效果（包括QQ），在 QQ 聊天中发送和查看时请选择“原图”。</p>
                <template v-if="isWindows">
                    <br/>
                    <p v-if="isWindows">Windows 自带相册无法查看动态效果，请右键选择打开方式 Edge 查看。</p>
                </template>
            </Prompt>
            <div v-show="exported" class="note">
                若点击导出后没有开始下载<br />请尝试<a :id="downloadAnchorElementId" class="downloadAnchor">点击此处</a>
            </div>
            <Notice v-show="exporting && !exportFailedMsg" :title="'请等待'" :type="'info'">
                正在导出，可能需要几秒
            </Notice>
            <Notice v-show="exportFailedMsg" :title="'导出失败'" :type="'danger'">
                {{ exportFailedMsg }}
            </Notice>
            <div v-show="exporting || exported || exportFailedMsg" class="note"
                :style="{color: exportFailedMsg?'red':undefined}">
                若导出失败或长时间无响应<br />请查看本页下方“浏览器限制”部分
            </div>
            <div class="exportConfigs">
                <ExportTimeConfig></ExportTimeConfig>
                <ExportAccentuationConfig></ExportAccentuationConfig>
                <ExportWatermarkConfig></ExportWatermarkConfig>
                <ExportEtcConfig></ExportEtcConfig>
                <ConfigSection :title="'已知的浏览器限制'">
                    <table class="fullWidth browserLimit">
                        <tbody>
                            <tr>
                                <td colspan="2">
                                    若导出失败，可能由于系统/浏览器限制了画布像素上限，
                                    请尝试设置<b>“像素上限”</b>为你的浏览器对应值，若仍然失败则逐步调低直至导出成功。
                                    需要清晰的图片，请换用其他设备/浏览器。
                                </td>
                            </tr>
                            <tr>
                                <th>浏览器</th>
                                <th>导出像素上限</th>
                            </tr>
                            <tr>
                                <td>Chrome/Edge/<br />常见自带浏览器</td>
                                <td>16000</td>
                            </tr>
                            <tr>
                                <td>Firefox</td>
                                <td>16000</td>
                            </tr>
                            <tr>
                                <td>iOS系统上<br />任意浏览器</td>
                                <td>4000</td>
                            </tr>
                            <tr>
                                <td colspan="2" class="smallNote">欢迎向我们反馈更多</td>
                            </tr>
                            <tr>
                                <th colspan="2">建议</th>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    请尽可能使用推荐的站距（线路延长手柄的长度）控制合适的站点密度，让线路图变得实用、美观、易于分享<br />
                                    作为参考：一张上海的线路图一般仅需要4000x3200的画布
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </ConfigSection>
                <ExportInfo></ExportInfo>
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
        max-width: 140px;
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
    margin: 8px 0px;
    font-size: 14px;
    color: #999;
    text-align: center;
    .downloadAnchor{
        color: cornflowerblue;
        text-decoration: underline;
    }
}
.browserLimit{
    font-size: 14px;
}

// TODO：删除它，改为使用统一的自定义alert组件
.questionMark{
    height: 12px;
    width: 12px;
    border: 1px solid #aaa;
    color: #aaa;
    font-size: 10px;
    line-height: 12px;
    text-align: center;
    border-radius: 100px;
    cursor: pointer;
    display: inline-block;
}

.rangeDisplay{
    margin-top: -10px;
    font-size: 12px;
    color: #999;
    text-align: center;
}

.exportConfigs{
    padding: 20px 0px 100px;
}

.apng-notice-entry{
    cursor: pointer;
    color: cornflowerblue
}
</style>