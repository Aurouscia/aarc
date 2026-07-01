<script setup lang="ts">
import ConfigSection from '../../configs/shared/ConfigSection.vue';
import { storeToRefs } from 'pinia';
import { useExportLocalConfigStore } from '@/app/localConfig/exportLocalConfig';
import { ANIMATED_EXPORT_LIMITS } from '../composables/useAnimatedExport';

const { miniImage } = storeToRefs(useExportLocalConfigStore())
const limits = ANIMATED_EXPORT_LIMITS
</script>

<template>
<ConfigSection :title="'略缩图'">
<table class="fullWidth"><tbody>
    <tr>
        <td style="width: 120px;">
            文件格式
        </td>
        <td>
            <select v-model="miniImage.fileFormat">
                <option value="png">PNG</option>
                <option value="webp">WEBP</option>
                <option value="jpeg">JPG</option>
                <option value="svg">SVG</option>
            </select>
        </td>
    </tr>
    <tr>
        <td>
            边长
        </td>
        <td>
            <select v-model.number="miniImage.sideLength">
                <option v-for="size in limits.sideLength.options" :key="size" :value="size">{{ size }} 像素</option>
            </select>
        </td>
    </tr>
    <tr>
        <td>
            线宽
        </td>
        <td>
            <input v-model.number="miniImage.lineWidth" type="range" :min="limits.lineWidth.min" :max="limits.lineWidth.max" step="1"/>
            <div class="rangeValue">{{ miniImage.lineWidth }}</div>
        </td>
    </tr>
</tbody></table>
</ConfigSection>
</template>
