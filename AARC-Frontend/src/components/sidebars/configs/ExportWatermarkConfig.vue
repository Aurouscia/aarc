<script lang="ts" setup>
import { useExportLocalConfigStore } from '@/app/localConfig/exportLocalConfig';
import ConfigSection from './shared/ConfigSection.vue';
import { watch } from 'vue';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { storeToRefs } from 'pinia';

const mainCvsDispatcher = useMainCvsDispatcher()
const store = useExportLocalConfigStore()
const { watermark:cfg } = storeToRefs(store)
watch(cfg, () => {
    configChangeHandler()
}, {deep:true})

let configApplyTimer = 0
function configChangeHandler(){
    clearTimeout(configApplyTimer)
    configApplyTimer = window.setTimeout(() => {
        mainCvsDispatcher.renderMainCvs({suppressRenderedCallback:true})
    }, 600)
}
</script>

<template>
<ConfigSection :title="'自定义水印'">
    <table v-if="cfg"><tbody>
        <tr>
            <td style="width: 70px;">启用导出</td>
            <td>
                <input v-model="cfg.enabled" type="checkbox">
            </td>
        </tr>
        <tr>
            <td>启用预览</td>
            <td>
                <input v-model="cfg.enabledPreview" type="checkbox">
            </td>
        </tr>
        <tr>
            <td>文字</td>
            <td>
                <input v-model="cfg.text" type="text">
            </td>
        </tr>
        <tr>
            <td>不透明度</td>
            <td>
                <input v-model="cfg.opacity" type="range" min="0" max="0.5" step="0.01">
                <input v-model="cfg.opacity" type="number" min="0" max="0.5" step="0.05">
            </td>
        </tr>
        <tr>
            <td>叠加模式</td>
            <td>
                <select v-model="cfg.coverMode">
                    <option :value="'under'">底部</option>
                    <option :value="'over'">顶部</option>
                </select>
            </td>
        </tr>
        <tr>
            <td>字体大小</td>
            <td>
                <input v-model="cfg.fontSize" type="range" min="50" max="500" step="50">
                <input v-model="cfg.fontSize" type="number" min="50" max="500" step="50">
            </td>
        </tr>
        <tr>
            <td>左右间隔</td>
            <td>
                <input v-model="cfg.xDist" type="range" min="0" max="1000" step="50">
                <input v-model="cfg.xDist" type="number" min="0" max="1000" step="50">
            </td>
        </tr>
        <tr>
            <td>上下间隔</td>
            <td>
                <input v-model="cfg.yDist" type="range" min="0" max="1000" step="50">
                <input v-model="cfg.yDist" type="number" min="0" max="1000" step="50">
            </td>
        </tr>
        <tr>
            <td>行偏移量</td>
            <td>
                <input v-model="cfg.xOffset" type="range" min="0" max="1000" step="50">
                <input v-model="cfg.xOffset" type="number" min="0" max="1000" step="50">
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <button class="minor" @click="store.watermarkReset">恢复默认值</button>
            </td>
        </tr>
    </tbody></table>
</ConfigSection>
</template>

<style lang="scss" scoped>
input{
    width: 140px;
    margin-left: 0px;
    margin-right: 0px;
}
</style>