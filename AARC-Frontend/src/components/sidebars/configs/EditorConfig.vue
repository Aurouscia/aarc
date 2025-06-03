<script lang="ts" setup>
import { useEditorLocalConfigStore } from '@/app/localConfig/editorLocalConfig';
import ConfigSection from './shared/ConfigSection.vue';
import { ref } from 'vue';

const { readStaNameFob, saveStaNameFob } = useEditorLocalConfigStore()
const staNameFob = ref(readStaNameFob())
function setStaNameFobTo(fob:number){
    staNameFob.value = fob
    saveStaNameFob(fob)
}
</script>

<template>
<ConfigSection :title="'编辑器（站名糊弄机制）'">
    <table><tbody>
        <tr><th>站名糊弄机制</th></tr>
        <tr>
            <td>
                <input v-model="staNameFob" @blur="saveStaNameFob(staNameFob)"
                    class="staNameFob" placeholder="0.1-10"/>
                <div class="staNameFobBtns">
                    <button class="minor" @click="setStaNameFobTo(0.01)">关闭</button>
                    <button class="minor" @click="setStaNameFobTo(0.7)">严格</button>
                    <button class="minor" @click="setStaNameFobTo(1)">标准</button>
                    <button class="minor" @click="setStaNameFobTo(3)">宽松</button>
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
@use './shared/configSection.scss';

.staNameFob{
    width: 100px;
    text-align: center;
}
</style>