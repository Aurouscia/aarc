<script setup lang="ts">
import { useRenderOptionsStore } from '@/models/stores/renderOptionsStore';
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';

const { bgOpacity } = storeToRefs(useRenderOptionsStore())
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
        <td colspan="2" class="smallNote">
            jpg不支持透明背景，请使用png或webp
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