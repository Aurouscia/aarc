<script lang="ts" setup>
import { useEditorLocalConfigStore } from '@/app/localConfig/editorLocalConfig';
import ConfigSection from './shared/ConfigSection.vue';
import PerformanceConfig from './PerformanceConfig.vue';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

const configStore = useEditorLocalConfigStore()
const { duplicateNameDistThrs, allowMergePtAndTerrain, ignoreStyleAndSpan, staNameSnapDiagonal, gridLabelSize } = storeToRefs(configStore)

onMounted(()=>{
    configStore.backCompat()
})
</script>

<template>
<ConfigSection :title="'编辑器'">
    <table><tbody>
        <tr><th>重复站名检测</th></tr>
        <tr>
            <td>
                <input v-model="duplicateNameDistThrs" placeholder="0-1000"/>
                <div>
                    <button class="minor" @click="duplicateNameDistThrs = 0">严格</button>
                    <button class="minor" @click="duplicateNameDistThrs = 200">标准</button>
                    <button class="minor" @click="duplicateNameDistThrs = 99999">关闭</button>
                </div>
                <div class="explain">
                    <p>当两个站的距离小于该值时，不会对“站名重复”作出警告，允许“靠近的地铁站与电车站同名”这种设计。</p>
                </div>
            </td>
        </tr>
        <tr><th>线路点与地形点合并</th></tr>
        <tr>
            <td>
                <select v-model="allowMergePtAndTerrain">
                    <option :value="false">不允许</option>
                    <option :value="true">允许</option>
                </select>
                <div class="explain">
                    <p>是否允许普通线路点与地形点在同坐标时自动合并。</p>
                </div>
            </td>
        </tr>
        <tr><th>无视样式和分段</th></tr>
        <tr>
            <td>
                <select v-model="ignoreStyleAndSpan">
                    <option :value="false">关闭</option>
                    <option :value="true">开启</option>
                </select>
                <div class="explain">
                    <p>如果卡顿，可以考虑关闭分段计算+隐藏线路样式，提高渲染效率，导出/预览时再恢复即可</p>
                </div>
            </td>
        </tr>
        <tr><th>斜向站名吸附</th></tr>
        <tr>
            <td>
                <select v-model="staNameSnapDiagonal">
                    <option value="inner">仅启用内侧</option>
                    <option value="outer">仅启用外侧</option>
                    <option value="both">同时启用</option>
                </select>
                <div class="explain">
                    <p>控制斜向站名吸附的位置：内侧（距离=正交距离）、外侧（距离=正交距离×√2）、或两者同时启用。</p>
                </div>
            </td>
        </tr>
        <tr><th>网格数字大小</th></tr>
        <tr>
            <td>
                <input v-model.number="gridLabelSize" type="range" :min="0" :max="8" :step="0.5"/>
                <div>{{ gridLabelSize }}</div>
                <div class="explain">
                    <p>控制网格线数字标注的相对大小<br/>（设为0则不显示）</p>
                </div>
            </td>
        </tr>
    </tbody></table>        
</ConfigSection>
<PerformanceConfig />
</template>

<style lang="scss" scoped>
input{
    width: 100px;
    text-align: center;
}
</style>