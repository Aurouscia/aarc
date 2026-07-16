<script lang="ts" setup>
import { useEditorLocalConfigStore } from '@/app/localConfig/editorLocalConfig';
import ConfigSection from './shared/ConfigSection.vue';
import { storeToRefs } from 'pinia';

const configStore = useEditorLocalConfigStore()
const { lineFob, staFob, staNameFob } = storeToRefs(configStore)
</script>

<template>
<ConfigSection :title="'性能优化（新）'">
    <table><tbody>
        <tr>
            <td class="explain">
                <p>对于超大地图，此处的“糊弄机制”可以在视角拉远时明显提高编辑器速度，建议使用默认值。可根据需要调整其阈值，设备卡顿的话使用“标准”或“宽松”。</p>
            </td>
        </tr>
        <tr><th>线路糊弄机制</th></tr>
        <tr>
            <td>
                <input v-model="lineFob" placeholder="0.1-10"/>
                <div>
                    <button class="minor" @click="lineFob = 0.01">关闭</button>
                    <button class="minor" @click="lineFob = 0.7">严格</button>
                    <button class="minor" @click="lineFob = 1">标准</button>
                    <button class="minor" @click="lineFob = 5">宽松</button>
                </div>
                <div class="explain">
                    <p>在视角拉远时，直接以直线连接线路点，并省略样式与分段，仅绘制线路本体，以加快响应速度。</p>
                    <p style="color:cornflowerblue">值越大，线路糊弄机制触发条件越宽松（性能越好、但拐角越明显）</p>
                    <p>设为0或1使用默认值</p>
                </div>
            </td>
        </tr>
        <tr><th>车站糊弄机制</th></tr>
        <tr>
            <td>
                <input v-model="staFob" placeholder="0.1-10"/>
                <div>
                    <button class="minor" @click="staFob = 0.01">关闭</button>
                    <button class="minor" @click="staFob = 0.7">严格</button>
                    <button class="minor" @click="staFob = 1">标准</button>
                    <button class="minor" @click="staFob = 5">宽松</button>
                </div>
                <div class="explain">
                    <p>在视角拉远时，车站只绘制填充圆，不描边、不根据分段取色，以加快响应速度。</p>
                    <p style="color:cornflowerblue">值越大，车站糊弄机制触发条件越宽松（性能越好、但颜色细节越少）</p>
                    <p>设为0或1使用默认值</p>
                </div>
            </td>
        </tr>
        <tr><th>站名糊弄机制</th></tr>
        <tr>
            <td>
                <input v-model="staNameFob" placeholder="0.1-10"/>
                <div>
                    <button class="minor" @click="staNameFob = 0.01">关闭</button>
                    <button class="minor" @click="staNameFob = 0.7">严格</button>
                    <button class="minor" @click="staNameFob = 1">标准</button>
                    <button class="minor" @click="staNameFob = 5">宽松</button>
                </div>
                <div class="explain">
                    <p>在视角拉远时，站名可被渲染为一个尺寸相同的矩形，以加快响应速度。</p>
                    <p>如果觉得用起来不舒服，可以在这里调整到本设备合适的值。</p>
                    <p style="color:cornflowerblue">值越大，表示“站名糊弄机制”触发条件越宽松（性能越好、但更难看到字）</p>
                    <p>设为0或1使用默认值</p>
                </div>
            </td>
        </tr>
    </tbody></table>        
</ConfigSection>
</template>

<style lang="scss" scoped>
input{
    width: 100px;
    text-align: center;
}
</style>
