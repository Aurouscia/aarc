<script setup lang="ts">
import { onMounted, onUnmounted, ref ,computed} from 'vue';
import SideBar from '../common/SideBar.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useEnvStore } from '@/models/stores/envStore';
import { useConfigStore } from '@/models/stores/configStore';
import { storeToRefs } from 'pinia';
import { clamp } from '@/utils/lang/clamp';
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';
import { enableContextMenu, disableContextMenu } from '@/utils/eventUtils/contextMenu';
import { useBrowserInfoStore } from '@/app/globalStores/browserInfo';
import TextTagConfig from './configs/TextTagConfig.vue';
import LineGroupConfig from './configs/LineGroupConfig.vue';
import LineStylesConfig from './configs/LineStylesConfig.vue';
import EditorConfig from './configs/EditorConfig.vue';
import FaqAsConfig from './configs/FaqAsConfig.vue';
import TextTagIconConfig from './configs/TextTagIconConfig.vue';
import PinyinConvertConfig from './configs/PinyinConvertConfig.vue';

const saveStore = useSaveStore()
const envStore = useEnvStore() //envStore.rerender() 默认会自动造成“阻止未保存离开”
const configStore = useConfigStore()
const { config } = storeToRefs(configStore)
const { preventLeaving } = usePreventLeavingUnsavedStore() //无需rerender的地方需要手动调用“阻止未保存离开”
//const cvsBlocksControl = useCvsBlocksControlStore()

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

const showBgRefImage = ref(false)
const bgRefImageOpacityDefault = 50
function applyBgImage(type:'url'|'opacity'|'left'|'top'|'right'|'bottom'|'width'|'height', value?:string){
    if(!config.value.bgRefImage)
        return
    const bri = config.value.bgRefImage
    if(type == 'url'){
        bri.url = value
        preventLeaving()
    }else{
        if(!value?.trim()){
            bri[type] = undefined
            return
        }
        let valueNum = value ? parseFloat(value) : NaN
        if(isNaN(valueNum))
            return
        if(type == 'opacity')
            valueNum = clamp(valueNum, 0, 100)
        bri[type] = valueNum
        preventLeaving()
    }
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
const { browserInfo } = storeToRefs(useBrowserInfoStore())
const visibilityChangedTimes = ref(0)
function visibilityChangedHandler(){
    if(document.visibilityState==='visible'){
        visibilityChangedTimes.value += 1
    }
}

//自定义线宽部分
const lineWidthList=computed(()=>{
    let widthList=[...new Set(['0.5', '0.75', '1', '1.25', '1.5', '1.75', '2']
    .concat(Object.keys(config.value.lineWidthMapped)))]
    widthList.sort((a,b)=>Number(a)-Number(b))
    return widthList
})
const customWidth=ref(0)
function addCustomWidthSetting(){
    if (!customWidth.value){
        //不允许设置宽度为0
        return
    }
    applyLineWidthMapped(`${customWidth.value}`,"staSize",'0')
    customWidth.value=0
}

onMounted(()=>{
    if(!config.value.lineWidthMapped){
        config.value.lineWidthMapped = {}
    }
    if(Object.keys(config.value.bgRefImage).length===0){
        config.value.bgRefImage = {
            left: 0,
            right: 0,
            opacity: bgRefImageOpacityDefault
        }
    }
    document.addEventListener('visibilitychange', visibilityChangedHandler)
})
onUnmounted(()=>{
    document.removeEventListener('visibilitychange', visibilityChangedHandler)
})

const sidebar = ref<InstanceType<typeof SideBar>>()
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
        <th>线宽</th>
        <th>车站</th>
        <th>站名</th>
    </tr>
    <tr v-for="width in lineWidthList">
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
        <td>
            <input v-model="customWidth" style="width: 3em;margin:0px">
        </td>
        <td>
            <button @click="addCustomWidthSetting()">+</button>
        </td>
        <td></td>
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

<EditorConfig></EditorConfig>

<PinyinConvertConfig></PinyinConvertConfig>

<div class="configSection">
<h2 :class="{sectorShown:showBgRefImage}" @click="showBgRefImage =!showBgRefImage">
    <div class="shownStatusIcon">{{ showBgRefImage? '×':'+' }}</div>
    <div>背景参考图</div>
</h2>
<table v-show="showBgRefImage" class="fullWidth bgRefImage">
    <tbody>
    <tr>
        <td class="explain" colspan="2">
            用于参考的底图，仅在编辑器内显示<br/>
            需要先上传图片到互联网<br/>
            再复制链接到此处
        </td>
    </tr>
    <tr>
        <td colspan="2">
            <b>图片链接</b>
            <input v-model="config.bgRefImage.url" @blur="e=>applyBgImage('url', (e.target as HTMLInputElement).value)"/>
            <div class="explain">
                复杂svg图片将导致缩放卡顿<br/>
                建议使用png/jpg格式
            </div>
        </td>
    </tr>
    <tr>
        <td>不透<br/>明度</td>
        <td>
            <input v-model="config.bgRefImage.opacity" type="range" :min="0" :max="100" :step="5"
                @blur="e=>applyBgImage('opacity', (e.target as HTMLInputElement).value)"/><br/>
            {{ config.bgRefImage.opacity || bgRefImageOpacityDefault }}%
        </td>
    </tr>
    <tr>
        <td>位置<br/>偏移</td>
        <td>
            <div class="bgRefImageOffsets">
                <div>
                    左<input v-model="config.bgRefImage.left" type="number" @blur="e=>applyBgImage('left', (e.target as HTMLInputElement).value)"/>
                </div>
                <div>
                    右<input v-model="config.bgRefImage.right" type="number" @blur="e=>applyBgImage('right', (e.target as HTMLInputElement).value)"/>
                </div>
                <div>
                    上<input v-model="config.bgRefImage.top" type="number" @blur="e=>applyBgImage('top', (e.target as HTMLInputElement).value)"/>
                </div>
                <div>
                    下<input v-model="config.bgRefImage.bottom" type="number" @blur="e=>applyBgImage('bottom', (e.target as HTMLInputElement).value)"/>
                </div>
                <div>
                    宽<input v-model="config.bgRefImage.width" type="number" @blur="e=>applyBgImage('width', (e.target as HTMLInputElement).value)"/>
                </div>
                <div>
                    高<input v-model="config.bgRefImage.height" type="number" @blur="e=>applyBgImage('height', (e.target as HTMLInputElement).value)"/>
                </div>
            </div>
            <div class="explain">
                “上下左右”为<br/>
                底图相对画布边缘偏移像素数<br/>
                正数表示向内，负数表示向外<br/>
                （若显示异常，请填写更多<br/>
                位置参数以修复）
            </div>
        </td>
    </tr>
</tbody>
</table>
</div>

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
.bgRefImage{
    .bgRefImageOffsets{
        display: flex;
        flex-direction: column;
        gap: 10px;
        input{
            width: 80px;
            &::placeholder {
                color: #aaa;
            }
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