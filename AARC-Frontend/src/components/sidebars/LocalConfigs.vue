<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SideBar from '../common/SideBar.vue';
import { useScalerLocalConfigStore } from '@/app/localConfig/scalerLocalConfig';
import Bowser from 'bowser'
import { useSaveStore } from '@/models/stores/saveStore';
import { useEnvStore } from '@/models/stores/envStore';
import { useConfigStore } from '@/models/stores/configStore';
import { storeToRefs } from 'pinia';
import { clamp } from '@/utils/lang/clamp';
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';

const saveStore = useSaveStore()
const envStore = useEnvStore() //envStore.rerender() 默认会自动造成“阻止未保存离开”
const configStore = useConfigStore()
const { config } = storeToRefs(configStore)
const { preventLeaving } = usePreventLeavingUnsavedStore() //无需rerender的地方需要手动调用“阻止未保存离开”

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
function applyBgImage(type:'url'|'opacity'|'left'|'top'|'right'|'bottom', value?:string){
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
        else
            valueNum = clamp(valueNum, -200, 200)
        bri[type] = valueNum
        preventLeaving()
    }
}

const showOthers = ref(false)
function removeNoLinePoints(){
    saveStore.removeNoLinePoints()
    envStore.rerender([], undefined)
}
const steppedScaleEnabled = ref(false)
const scalerLocalConfig = useScalerLocalConfigStore()
async function steppedScaleChange(){
    const enabled = steppedScaleEnabled.value
    scalerLocalConfig.saveSteppedScaleEnabled(enabled)
}
const browserInfo = ref<ReturnType<typeof Bowser.parse>>()

onMounted(()=>{
    if(!config.value.lineWidthMapped){
        config.value.lineWidthMapped = {}
    }
    if(!config.value.bgRefImage){
        config.value.bgRefImage = {
            left: 0,
            right: 0,
            opacity: bgRefImageOpacityDefault
        }
    }
    steppedScaleEnabled.value = scalerLocalConfig.readSteppedScaleEnabled()
    browserInfo.value = Bowser.parse(navigator.userAgent)
})
const sidebar = ref<InstanceType<typeof SideBar>>()
defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
</script>

<template>
<SideBar ref="sidebar" :enforce-y-scroll="true">
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
            换乘站脱离，请保存后刷新<br/>
            并重新拼合脱离处
        </td>
    </tr>
</tbody></table>

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
                    左<input v-model="config.bgRefImage.left" type="number" @blur="e=>applyBgImage('left', (e.target as HTMLInputElement).value)"/>%
                </div>
                <div>
                    右<input v-model="config.bgRefImage.right" type="number" @blur="e=>applyBgImage('right', (e.target as HTMLInputElement).value)"/>%
                </div>
                <div>
                    上<input v-model="config.bgRefImage.top" type="number" @blur="e=>applyBgImage('top', (e.target as HTMLInputElement).value)"/>%
                </div>
                <div>
                    下<input v-model="config.bgRefImage.bottom" type="number" @blur="e=>applyBgImage('bottom', (e.target as HTMLInputElement).value)"/>%
                </div>
            </div>
            <div class="explain">
                底图相对画布边缘偏移百分比<br/>
                正数表示向内，负数表示向外<br/>
                （建议上/下留空一个<br/>
                以保证长宽比正确）
            </div>
        </td>
    </tr>
</tbody>
</table>

<h2 :class="{sectorShown:showOthers}" @click="showOthers = !showOthers">
    <div class="shownStatusIcon">{{ showOthers ? '×':'+' }}</div>
    <div>杂项</div>
</h2>
<table v-show="showOthers" class="fullWidth">
    <tbody>
    <tr>
        <td>
            <button @click="removeNoLinePoints">执行</button>
        </td>
        <td>
            <b>清除无线路车站</b>
            <div class="explain">仅限无站名的车站</div>
        </td>
    </tr>
    <tr>
        <td>
            <input type="checkbox" v-model="steppedScaleEnabled" @change="steppedScaleChange"/>
        </td>
        <td>
            <b>步进式缩放</b>
            <div class="explain">仅本设备有效</div>
            <div class="explain">如果缩放时显示异常可开启</div>
            <div class="explain">会降低性能和体验</div>
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
</tbody></table>
</SideBar>
</template>

<style scoped lang="scss">
h2{
    display: flex;
    align-items: center;
    color: #999;
    font-size: 20px;
    gap: 10px;
    margin: 5px;
    border-top: 1px solid #ccc;
    padding-top: 5px;
    cursor: pointer;
    user-select: none;
    &.sectorShown{
        font-weight: bold;
        color: black
    }
    .shownStatusIcon{
        width: 20px;
        height: 20px;
        font-size: 16px;
        line-height: 20px;
        font-weight: bold;
        text-align: center;
        border: 1px solid #999;
        border-radius: 5px;
    }
}
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
.explain{
    font-size: 14px;
    color: #666
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
td{
    min-width: 40px;
}
</style>