<script setup lang="ts">
import ConfigSection from '../../configs/shared/ConfigSection.vue';
import { storeToRefs } from 'pinia';
import { useExportLocalConfigStore } from '@/app/localConfig/exportLocalConfig';
import { ANIMATED_EXPORT_LIMITS } from '../composables/useAnimatedExport';
import Notice from '@/components/common/Notice.vue';

const { animationMini } = storeToRefs(useExportLocalConfigStore())
const limits = ANIMATED_EXPORT_LIMITS
</script>

<template>
<ConfigSection :title="'略缩图动画'">
<table class="fullWidth"><tbody>
    <tr>
        <td style="width: 120px;">
            间隔 (毫秒)
        </td>
        <td>
            <input v-model.number="animationMini.interval" type="number" :min="limits.interval.min" :max="limits.interval.max" step="100"/>
        </td>
    </tr>
    <tr>
        <td>
            文件格式
        </td>
        <td>
            <select v-model="animationMini.fileFormat">
                <option value="gif">GIF</option>
                <option value="png">PNG(不推荐)</option>
            </select>
        </td>
    </tr>
    <tr>
        <td>
            隐藏未开通
        </td>
        <td>
            <input v-model="animationMini.hideNotOpened" type="checkbox"/>
        </td>
    </tr>
    <tr>
        <td>
            边长
        </td>
        <td>
            <select v-model.number="animationMini.mini.sideLength">
                <option v-for="size in limits.sideLength.options" :key="size" :value="size">{{ size }} 像素</option>
            </select>
        </td>
    </tr>
    <tr v-if="animationMini.mini.sideLength >= 1024">
        <td colspan="2">
            <Notice :type="'warn'">
                选择 1024 以上时，时间和内存消耗会显著提升，可能用时很久，可能爆内存（尤其是移动端）
            </Notice>            
        </td>
    </tr>
    <tr>
        <td>
            线宽
        </td>
        <td>
            <input v-model.number="animationMini.mini.lineWidth" type="range" :min="limits.lineWidth.min" :max="limits.lineWidth.max" step="1"/>
            <div class="rangeValue">{{ animationMini.mini.lineWidth }}</div>
        </td>
    </tr>
</tbody></table>
</ConfigSection>
</template>
