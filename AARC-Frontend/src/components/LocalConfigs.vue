<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SideBar from './common/SideBar.vue';
import { useScalerLocalConfigStore } from '@/app/localConfig/scalerLocalConfig';
import Bowser from 'bowser'

const steppedScaleEnabled = ref(false)
const scalerLocalConfig = useScalerLocalConfigStore()
async function steppedScaleChange(){
    const enabled = steppedScaleEnabled.value
    scalerLocalConfig.saveSteppedScaleEnabled(enabled)
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
            <input type="checkbox" v-model="steppedScaleEnabled" @change="steppedScaleChange"/>
        </td>
        <td>
            步进式缩放(仅限触屏)
        </td>
    </tr>
    <tr v-if="browserInfo">
        <td colspan="2" class="browserInfo">
            <p>软件：{{ browserInfo.browser.name }}</p>
            <p>引擎：{{ browserInfo.engine.name }}</p>
            <p>平台：{{ browserInfo.platform.type }}</p>
            <p>系统：{{ browserInfo.os.name }}</p>
        </td>
    </tr>
</tbody></table>
</SideBar>
</template>

<style scoped lang="scss">
.browserInfo{
    text-align: left;
}
</style>