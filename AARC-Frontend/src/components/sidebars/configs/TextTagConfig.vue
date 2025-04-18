<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { useConfigStore } from '@/models/stores/configStore';
import { useEnvStore } from '@/models/stores/envStore';
import { onMounted } from 'vue';

const { config } = storeToRefs(useConfigStore())
const envStore = useEnvStore()

let rtimer = 0
function c(){
    window.clearTimeout(rtimer)
    rtimer = window.setTimeout(()=>{
        envStore.rerender([], [])
    }, 200)
}
onMounted(()=>{
    config.value.textTagPlain.fontSize ??= 1
    config.value.textTagPlain.subFontSize??= 1

    config.value.textTagForLine.padding??= 1
    config.value.textTagForLine.fontSize??= 1
    config.value.textTagForLine.subFontSize??= 1

    config.value.textTagForTerrain.fontSize??= 1
    config.value.textTagForTerrain.subFontSize??= 1
})
</script>

<template>
<ConfigSection :title="'文本标签'">
    <table class="fullWidth"><tbody>
        <tr>
            <th colspan="2">
                一般标签
            </th>
        </tr>
        <tr>
            <td>主文字<br/>大小</td>
            <td>
                <input type="range" v-model="config.textTagPlain.fontSize" :min="0.5" :max="5" :step="0.25" @input="c"/>
                <div>{{ config.textTagPlain.fontSize ?? 1 }}</div>
            </td>
        </tr>
        <tr>
            <td>副文字<br/>大小</td>
            <td>
                <input type="range" v-model="config.textTagPlain.subFontSize" :min="0.5" :max="5" :step="0.25" @input="c"/>
                <div>{{ config.textTagPlain.subFontSize ?? 1 }}</div>
            </td>
        </tr>
        <tr>
            <th colspan="2">
                线路名标签
            </th>
        </tr>
        <tr>
            <td>主文字<br/>大小</td>
            <td>
                <input type="range" v-model="config.textTagForLine.fontSize" :min="0.5" :max="5" :step="0.25" @input="c"/>
                <div>{{ config.textTagForLine.fontSize ?? 1 }}</div>
            </td>
        </tr>
        <tr>
            <td>副文字<br/>大小</td>
            <td>
                <input type="range" v-model="config.textTagForLine.subFontSize" :min="0.5" :max="5" :step="0.25" @input="c"/>
                <div>{{ config.textTagForLine.subFontSize ?? 1 }}</div>
            </td>
        </tr>
        <tr>
            <td>边距</td>
            <td>
                <input type="range" v-model="config.textTagForLine.padding" :min="0.5" :max="5" :step="0.25" @input="c"/>
                <div>{{ config.textTagForLine.padding ?? 1 }}</div>
            </td>
        </tr>
        <tr>
            <th colspan="2">
                地形名标签
            </th>
        </tr>
        <tr>
            <td>主文字<br/>大小</td>
            <td>
                <input type="range" v-model="config.textTagForTerrain.fontSize" :min="0.5" :max="5" :step="0.25" @input="c"/>
                <div>{{ config.textTagForTerrain.fontSize ?? 1 }}</div>
            </td>
        </tr>
        <tr>
            <td>副文字<br/>大小</td>
            <td>
                <input type="range" v-model="config.textTagForTerrain.subFontSize" :min="0.5" :max="5" :step="0.25" @input="c"/>
                <div>{{ config.textTagForTerrain.subFontSize ?? 1 }}</div>
            </td>
        </tr>
        <tr>
            <td colspan="2" class="explain">
                对所有标签生效<br/>（设置过非0值的除外）
            </td>
        </tr>
    </tbody></table>
</ConfigSection>
</template>

<style lang="scss" scoped>
@use './shared/configSection.scss'
</style>