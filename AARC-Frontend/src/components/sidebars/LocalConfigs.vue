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

const saveStore = useSaveStore()
const envStore = useEnvStore()
const configStore = useConfigStore()
const { config } = storeToRefs(configStore)

const steppedScaleEnabled = ref(false)
const scalerLocalConfig = useScalerLocalConfigStore()
async function steppedScaleChange(){
    const enabled = steppedScaleEnabled.value
    scalerLocalConfig.saveSteppedScaleEnabled(enabled)
}

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

const sidebar = ref<InstanceType<typeof SideBar>>()
defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})

const showOthers = ref(false)
function removeNoLinePoints(){
    saveStore.removeNoLinePoints()
    envStore.rerender([], undefined)
}
const browserInfo = ref<ReturnType<typeof Bowser.parse>>()
onMounted(()=>{
    if(!config.value.lineWidthMapped){
        config.value.lineWidthMapped = {}
    }
    steppedScaleEnabled.value = scalerLocalConfig.readSteppedScaleEnabled()
    browserInfo.value = Bowser.parse(navigator.userAgent)
})
</script>

<template>
<SideBar ref="sidebar">
<h2 :class="{sectorShown:showLineWidthMapped}" @click="showLineWidthMapped = !showLineWidthMapped">
    <div class="shownStatusIcon">{{ showLineWidthMapped ? '×':'+' }}</div>
    <div>线宽对应车站尺寸</div>
</h2>
<table v-show="showLineWidthMapped" class="fullWidth lineWidthMapped"><tbody>
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
<h2 :class="{sectorShown:showOthers}" @click="showOthers = !showOthers">
    <div class="shownStatusIcon">{{ showOthers ? '×':'+' }}</div>
    <div>杂项</div>
</h2>
<table v-show="showOthers" class="fullWidth"><tbody>
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
</style>