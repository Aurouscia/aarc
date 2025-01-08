<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SideBar from './common/SideBar.vue';
import { useScalerLocalConfigStore } from '@/app/localConfig/scalerLocalConfig';
import Bowser from 'bowser'
import { useSaveStore } from '@/models/stores/saveStore';
import { useEnvStore } from '@/models/stores/envStore';

const saveStore = useSaveStore()
const envStore = useEnvStore()
const steppedScaleEnabled = ref(false)
const scalerLocalConfig = useScalerLocalConfigStore()
async function steppedScaleChange(){
    const enabled = steppedScaleEnabled.value
    scalerLocalConfig.saveSteppedScaleEnabled(enabled)
}

function removeNoLinePoints(){
    saveStore.removeNoLinePoints()
    envStore.rerender([], undefined)
}

const sidebar = ref<InstanceType<typeof SideBar>>()
defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})

const browserInfo = ref<ReturnType<typeof Bowser.parse>>()
onMounted(()=>{
    steppedScaleEnabled.value = scalerLocalConfig.readSteppedScaleEnabled()
    browserInfo.value = Bowser.parse(navigator.userAgent)
})
</script>

<template>
<SideBar ref="sidebar">
<table class="fullWidth"><tbody>
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