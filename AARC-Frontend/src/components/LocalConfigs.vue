<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SideBar from './common/SideBar.vue';
import { useScalerLocalConfigStore } from '@/app/localConfig/scalerLocalConfig';

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

onMounted(()=>{
    steppedScaleEnabled.value = scalerLocalConfig.readSteppedScaleEnabled()
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
</tbody></table>
</SideBar>
</template>

<style scoped lang="scss">

</style>