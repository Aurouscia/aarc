<script setup lang="ts">
import { useRenderOptionsStore } from '@/models/stores/renderOptionsStore';
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { useExportLocalConfigStore } from '@/app/localConfig/exportLocalConfig';

const { bgOpacity } = storeToRefs(useRenderOptionsStore())
const { bgRefImage } = storeToRefs(useExportLocalConfigStore())
</script>

<template>
<ConfigSection :title="'其他设置'">
<table class="fullWidth"><tbody>
    <tr>
        <td>背景<br/>透明</td>
        <td>
            <input v-model.number="bgOpacity" type="range" :min="0" :max="1" :step="0.1"/>
            <div>{{ bgOpacity }}</div>
        </td>
    </tr>
    <tr>
        <td colspan="2" class="smallNote">jpg不支持透明背景，请使用其他格式</td>
    </tr>
    <tr>
        <td>导出<br/>参考图</td>
        <td>
            <input v-model="bgRefImage" type="checkbox"/>
        </td>
    </tr>
    <tr>
        <td colspan="2" class="smallNote">
            请确保勾选“背景参考图”中的“用于导出”<br/>
            如果导出效果异常，请检查“位置偏移”中的设置是否将图片位置完全约束<br/>
            <div v-if="bgRefImage" class="smallNoteVital">
                警告：会显著增大导出文件尺寸
            </div>
        </td>
    </tr>
</tbody></table>
</ConfigSection>
</template>

<style lang="scss" scoped>
// TODO: 改为统一的“range+显示”组件
.rangeDisplay{
    margin-top: -10px;
    font-size: 12px;
    color: #999;
    text-align: center;
}
</style>