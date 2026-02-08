<script setup lang="ts">
import { ref, watch } from 'vue';
import { useConfigStore } from '@/models/stores/configStore';
import FontInput from '../shared/FontInput.vue';
import ConfigSection from './shared/ConfigSection.vue';
import { storeToRefs } from 'pinia';
import Prompt from '@/components/common/Prompt.vue';
import { useEnvStore } from '@/models/stores/envStore';

const cs = useConfigStore()
const envStore = useEnvStore()
const { config } = storeToRefs(cs)
const guideShow = ref(false)

watch(()=>[
    config.value.staNameFont,
    config.value.staNameSubFont,
    config.value.textTagFont,
    config.value.textTagSubFont
], ()=>{
    c()
})

// TODO：改成lodash的debounce，这样实在难看
let rtimer = 0
function c(){
    window.clearTimeout(rtimer)
    rtimer = window.setTimeout(()=>{
        envStore.rerender([], [])
    }, 1000)
}
</script>

<template>
<ConfigSection :title="'字体设置'">
    <table><tbody>
        <tr>
            <td colspan="2">
                <button class="lite confirm" @click="guideShow=true">查看使用说明</button>
            </td>
        </tr>
        <tr>
            <td>主站名</td>
            <td><FontInput v-model="config.staNameFont"></FontInput></td>
        </tr>
        <tr>
            <td>副站名</td>
            <td><FontInput v-model="config.staNameSubFont"></FontInput></td>
        </tr>
        <tr>
            <td>标签<br/>主文本</td>
            <td><FontInput v-model="config.textTagFont"></FontInput></td>
        </tr>
        <tr>
            <td>标签<br/>副文本</td>
            <td><FontInput v-model="config.textTagSubFont"></FontInput></td>
        </tr>
    </tbody></table>
    <Prompt v-if="guideShow" :bg-click-close="true" @close="guideShow=false">
        <p>1. 请确保所需的字体已在当前设备安装（例如windows内置“宋体”，macOS内置“Songti SC”）</p>
        <p>2. 多个字体写多行，如果第一个字体不支持，会使用第二个，以此类推（例如：仅支持英语的A字体应放在中英两用B字体前面，以确保同一段内英文使用A字体，中文使用B字体）</p>
        <p>3. 如果输入框下方的“测试文本”变了字体，说明设置成功</p>
        <p>4. 跨平台通用的内置字体：serif、cursive、monospace</p>
    </Prompt>
</ConfigSection>
</template>

<style scoped>
p{
    margin: 0.5em 0;
}
</style>