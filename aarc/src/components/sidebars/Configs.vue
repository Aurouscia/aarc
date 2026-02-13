<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import SideBar from '../common/SideBar.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useEnvStore } from '@/models/stores/envStore';
import { useConfigStore } from '@/models/stores/configStore';
import { storeToRefs } from 'pinia';
import { clamp } from '@/utils/lang/clamp';
import { enableContextMenu, disableContextMenu } from '@/utils/eventUtils/contextMenu';
import { useBrowserInfoStore } from '@/app/globalStores/browserInfo';
import TextTagConfig from './configs/TextTagConfig.vue';
import LineGroupConfig from './configs/LineGroupConfig.vue';
import LineStylesConfig from './configs/LineStylesConfig.vue';
import EditorConfig from './configs/EditorConfig.vue';
import FaqAsConfig from './configs/FaqAsConfig.vue';
import TextTagIconConfig from './configs/TextTagIconConfig.vue';
import PinyinConvertConfig from './configs/PinyinConvertConfig.vue';
import { useNameEditStore } from '@/models/stores/nameEditStore';
import SaveConfigReuse from './configs/SaveConfigReuse.vue';
import BgRefImageConfig from './configs/BgRefImageConfig.vue';
import FontConfig from './configs/FontConfig.vue';
import PatternsConfig from './configs/PatternsConfig.vue';

const saveStore = useSaveStore()
const envStore = useEnvStore() //envStore.rerender() 默认会自动造成“阻止未保存离开”
const configStore = useConfigStore()
const { config } = storeToRefs(configStore)
const nameEditStore = useNameEditStore()

const showLineWidthMapped = ref(false)
function applyLineWidthMapped(width:string, setItem:'staSize'|'staNameSize', value?:string){
    if(!config.value.lineWidthMapped)
        config.value.lineWidthMapped = {}
    const valueNum = value ? parseFloat(value) : NaN
    const lwm = config.value.lineWidthMapped
    if(!lwm[width])
        lwm[width] = {}
    if(!isNaN(valueNum))
        lwm[width][setItem] = clamp(valueNum, 0.1, 3)
    else
        lwm[width][setItem] = undefined
    envStore.rerender([], undefined)
}

const showOthers = ref(false)
// function removeNoLinePoints(){
//     saveStore.removeNoLinePoints()
//     envStore.rerender([], undefined)
// }
function removeDanglingPointLinks(){
    saveStore.removeDanglingPointLinks()
    envStore.rerender([], [])
}
function removeRepeatPt(){
    envStore.removeRepeatPtOnLines()
}
const browserInfoStore = useBrowserInfoStore()
const { browserInfo } = storeToRefs(browserInfoStore)
const visibilityChangedTimes = ref(0)
function visibilityChangedHandler(){
    if(document.visibilityState==='visible'){
        visibilityChangedTimes.value += 1
    }
}

onMounted(()=>{
    if(!config.value.lineWidthMapped){
        config.value.lineWidthMapped = {}
    }
    document.addEventListener('visibilitychange', visibilityChangedHandler)
})
onUnmounted(()=>{
    document.removeEventListener('visibilitychange', visibilityChangedHandler)
})

const sidebar = useTemplateRef('sidebar')
defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
</script>

<template>
<SideBar ref="sidebar" @extend="enableContextMenu()" @fold="disableContextMenu()" :enforce-y-scroll="true">
<LineStylesConfig></LineStylesConfig>

<LineGroupConfig></LineGroupConfig>

<div class="configSection">
<h2 :class="{sectorShown:showLineWidthMapped}" @click="showLineWidthMapped = !showLineWidthMapped">
    <div class="shownStatusIcon">{{ showLineWidthMapped ? '×':'+' }}</div>
    <div>线宽对应车站尺寸</div>
</h2>
<table v-show="showLineWidthMapped" class="fullWidth lineWidthMapped">
    <tbody>
    <tr>
        <td class="explain" colspan="3">
            设置特定宽度的线路对应的<br/>车站尺寸/站名大小<br/>
            (会被线路单独设置覆盖)
        </td>
    </tr>
    <tr>
        <th></th>
        <th>车站</th>
        <th>站名</th>
    </tr>
    <tr v-for="width in ['0.5', '0.75', '1', '1.25', '1.5', '1.75', '2']">
        <td>{{ width }}</td>
        <td>
            <input :value="config.lineWidthMapped[width]?.staSize" :placeholder="width"
                @blur="e=>applyLineWidthMapped(width, 'staSize', (e.target as HTMLInputElement).value)"/>
        </td>
        <td>
            <input :value="config.lineWidthMapped[width]?.staNameSize" :placeholder="width"
                @blur="e=>applyLineWidthMapped(width, 'staNameSize', (e.target as HTMLInputElement).value)"/>
        </td>
    </tr>
    <tr>
        <td class="explain" colspan="3">
            调小车站尺寸可能会造成<br/>
            换乘站脱离，请手动拼合脱离处
        </td>
    </tr>
</tbody></table>
</div>

<TextTagConfig></TextTagConfig>

<TextTagIconConfig></TextTagIconConfig>

<PatternsConfig></PatternsConfig>

<FontConfig></FontConfig>

<EditorConfig></EditorConfig>

<PinyinConvertConfig></PinyinConvertConfig>

<BgRefImageConfig></BgRefImageConfig>

<SaveConfigReuse></SaveConfigReuse>

<FaqAsConfig></FaqAsConfig>

<div class="configSection">
<h2 :class="{sectorShown:showOthers}" @click="showOthers = !showOthers">
    <div class="shownStatusIcon">{{ showOthers ? '×':'+' }}</div>
    <div>杂项</div>
</h2>
<table v-show="showOthers" class="fullWidth">
    <tbody>
    <tr>
        <td>
            暂停<br/>使用
            <!-- <button @click="removeNoLinePoints">执行</button> -->
        </td>
        <td>
            <b>清除无线路车站</b>
            <div class="explain">仅限无站名的车站</div>
        </td>
    </tr>
    <tr>
        <td>
            <button @click="removeDanglingPointLinks">执行</button>
        </td>
        <td>
            <b>清除残留车站连线</b>
        </td>
    </tr>
    <tr>
        <td>
            <button @click="removeRepeatPt">执行</button>
        </td>
        <td>
            <b>修复线路节点重复问题</b>
        </td>
    </tr>
    <tr>
        <td>
            <button @click="nameEditStore.optimizeAllNamePos()">执行</button>
        </td>
        <td>
            <b>重置所有站名位置</b>
        </td>
    </tr>
    <tr>
        <td>线路<br/>延长<br/>手柄<br/>长度</td>
        <td>
            正<input v-model="config.lineExtensionHandleLengthVert" style="width: 80px;"/><br/>
            斜<input v-model="config.lineExtensionHandleLengthInc" style="width: 80px;"/><br/>
            <div class="explain">
                可填固定值，例如 200 <br/>
                可填倍率，例如 *1.5<br/>
                斜着的填写例如^200，则识别为直角边为200的等腰直角三角形的斜边
            </div>
        </td>
    </tr>
    <tr v-if="browserInfo">
        <td colspan="2" class="browserInfo">
            <div>
                软件 {{ browserInfo.browser.name }}
                <span class="ver">{{ browserInfo.browser.version }}</span>
            </div>
            <div>
                引擎 {{ browserInfo.engine.name }}
                <span class="ver">{{ browserInfo.engine.version }}</span>
            </div>
            <div>
                平台 {{ browserInfo.platform.type }}
                <span class="ver">{{ browserInfo.platform.model }}</span>
            </div>
            <div>
                系统 {{ browserInfo.os.name }}
                <span class="ver">{{ browserInfo.os.version }}</span>
            </div>
            <div>
                <span class="ver">{{ browserInfoStore.ua }}</span>
                <br/>
                <span class="ver">是百度app：{{ browserInfoStore.isBaiduApp }}</span>
                <br/>
                <span class="ver">是QQ内置：{{ browserInfoStore.isQQBuiltIn }}</span>
            </div>
        </td>
    </tr>
    <tr>
        <td colspan="2">
            visibilityChanged：
            {{ visibilityChangedTimes }}
        </td>
    </tr>
    <tr>
        <td colspan="2">
            <button class="lite" @click="configStore.writeConfigToSave();console.log({...saveStore.save})">打印存档到控制台</button>
        </td>
    </tr>
</tbody></table>
</div>

</SideBar>
</template>

<style scoped lang="scss">
.lineWidthMapped{
    input{
        width: 80px;
        &::placeholder {
            color: #aaa;
        }
    }
}
.browserInfo{
    text-align: left;
    &>div{
        margin: 10px 0px 10px 0px;
    }
    .ver{
        font-size: 14px;
        color: gray;
    }
}
</style>