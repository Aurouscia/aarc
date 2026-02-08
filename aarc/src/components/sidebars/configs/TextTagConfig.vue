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
    }, 500)
}
onMounted(()=>{
    config.value.textTagPlain.fontSize ??= 1
    config.value.textTagPlain.subFontSize??= 1

    config.value.textTagForLine.padding??= 1
    config.value.textTagForLine.fontSize??= 1
    config.value.textTagForLine.subFontSize??= 1
    config.value.textTagForLine.width??= 0

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
            <td rowspan="2">边距</td>
            <td>
                <input type="range" v-model="config.textTagForLine.padding" :min="0.5" :max="5" :step="0.25" @input="c"/>
                <div>
                    <input type="number" v-model="config.textTagForLine.width" :min="0" :step="1" @input="c"/>
                </div>
            </td>
        </tr>
        <tr>
            <td>
                <div>
                    <input type="checkbox" v-model="config.textTagForLine.edgeAnchorOutsidePadding" @input="c"/>
                    <div class="explain">
                        边缘锚点设为边距外侧
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td>横向<br/>锚点</td>
            <td>
                <select v-model="config.textTagForLine.anchorX" @change="c">
                    <option :value="1">左侧</option>
                    <option :value="undefined">中心</option>
                    <option :value="-1">右侧</option>
                </select>
                <div class="explain">可能需要重新定位</div>
            </td>
        </tr>
        <tr>
            <td>纵向<br/>锚点</td>
            <td>
                <select v-model="config.textTagForLine.anchorY" @change="c">
                    <option :value="1">顶部</option>
                    <option :value="undefined">中心</option>
                    <option :value="-1">底部</option>
                </select>
                <div class="explain">可能需要重新定位</div>
            </td>
        </tr>
        <tr>
            <td>文字<br/>对齐</td>
            <td>
                <select v-model="config.textTagForLine.textAlign" @change="c">
                    <option :value="undefined">跟随横向锚点</option>
                    <option :value="1">靠左</option>
                    <option :value="0">居中</option>
                    <option :value="-1">靠右</option>
                </select>
            </td>
        </tr>
        <tr>
            <td>宽度</td>
            <td>
                <input type="range" v-model="config.textTagForLine.width" :min="0" :max="300" :step="5" @input="c"/>
                <div>
                    <input type="number" v-model="config.textTagForLine.width" :min="0" :step="1" @input="c"/>
                </div>
                <div class="explain">如果短于指定宽度<br/>将会向锚点对侧拉长</div>
                <div class="explain">设为0将其关闭</div>
            </td>
        </tr>
        <tr>
            <td>数字<br/>放大</td>
            <td>
                <select v-model="config.textTagForLineDropCap" @click="c">
                    <option :value="true">开启</option>
                    <option :value="false">关闭</option>
                </select>
                <div class="explain">若字母数字+"线"结尾</div>
                <div class="explain">将会无视文字对齐</div>
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
                以上设置对所有标签生效<br/>（设置过非0/非默认值的除外）
            </td>
        </tr>
    </tbody></table>
</ConfigSection>
</template>