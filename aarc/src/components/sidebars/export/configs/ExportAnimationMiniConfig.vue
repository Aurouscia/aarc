<script setup lang="ts">
import ConfigSection from '../../configs/shared/ConfigSection.vue';
import { storeToRefs } from 'pinia';
import { useExportLocalConfigStore } from '@/app/localConfig/exportLocalConfig';

const { animationMini } = storeToRefs(useExportLocalConfigStore())
</script>

<template>
<ConfigSection :title="'略缩图动画（新）'">
<table class="fullWidth"><tbody>
    <tr>
        <td style="width: 120px;">
            间隔（毫秒）
        </td>
        <td>
            <input v-model.number="animationMini.interval" type="number" min="100" max="3000" step="100"/>
        </td>
    </tr>
    <tr>
        <td>
            文件格式
        </td>
        <td>
            <select v-model="animationMini.fileFormat">
                <option value="gif">GIF</option>
                <option value="png">APNG</option>
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
</tbody></table>
</ConfigSection>
</template>
