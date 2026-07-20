<script setup lang="ts">
import { useSaveStore } from '@/models/stores/saveStore';
import ConfigSection from './shared/ConfigSection.vue';
import { useEnvStore } from '@/models/stores/envStore';
import { useConfigStore } from '@/models/stores/configStore';
import { storeToRefs } from 'pinia';
import { useNameEditStore } from '@/models/stores/nameEditStore';
import { onMounted, onUnmounted, ref } from 'vue';
import { useBrowserInfoStore } from '@/app/globalStores/browserInfo';
import { configDefault } from '@/models/stores/configStore';

const saveStore = useSaveStore()
const envStore = useEnvStore() //envStore.rerender() 默认会自动造成“阻止未保存离开”
const configStore = useConfigStore()
const { config } = storeToRefs(configStore)
const nameEditStore = useNameEditStore()

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

const snapRayAnglesText = ref('')
const snapRayAnglesForFreeText = ref('')
onMounted(()=>{
    document.addEventListener('visibilitychange', visibilityChangedHandler)
    snapRayAnglesText.value = config.value.snapRayAngles.join('\n')
    snapRayAnglesForFreeText.value = config.value.snapRayAnglesForFree.join('\n')
})
onUnmounted(()=>{
    document.removeEventListener('visibilitychange', visibilityChangedHandler)
})
function applySnapRayAngles(){
    const angles = snapRayAnglesText.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    config.value.snapRayAngles = angles.length > 0 ? angles : [...configDefault.snapRayAngles]
}
function applySnapRayAnglesForFree(){
    const angles = snapRayAnglesForFreeText.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    config.value.snapRayAnglesForFree = angles.length > 0 ? angles : [...configDefault.snapRayAnglesForFree]
}
</script>

<template>
<ConfigSection :title="'杂项'">
<table class="fullWidth">
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
    <tr>
        <td>延长线<br/>吸附<br/>角度</td>
        <td>
            <textarea v-model="snapRayAnglesText" rows="4" style="width: 120px;"/><br/>
            <button class="minor" @click="applySnapRayAngles">应用</button>
            <div class="explain">
                一行一个角度（度），自动取模 180。<br/>
                例如：0、45、90、135<br/>
                配置 30 表示 30° 和 210° 方向
            </div>
        </td>
    </tr>
    <tr>
        <td>free点<br/>延长线<br/>吸附<br/>角度</td>
        <td>
            <textarea v-model="snapRayAnglesForFreeText" rows="4" style="width: 120px;"/><br/>
            <button class="minor" @click="applySnapRayAnglesForFree">应用</button>
            <div class="explain">
                当前点或邻点任意为 free 点时使用。<br/>
                否则使用上方的普通延长线吸附角度。
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
</ConfigSection>
</template>

<style scoped lang="scss">
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