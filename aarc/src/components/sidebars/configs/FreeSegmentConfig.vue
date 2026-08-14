<script lang="ts" setup>
import { useConfigStore } from '@/models/stores/configStore';
import ConfigSection from './shared/ConfigSection.vue';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';

const configStore = useConfigStore()
const { config, snapRayAnglesForFreeEnabled } = storeToRefs(configStore)

const snapRayAnglesForFreeText = ref('')
watch(() => config.value.snapRayAnglesForFree, (angles) => {
    snapRayAnglesForFreeText.value = angles.join('\n')
}, { immediate: true })

function enableFreeSegmentDirection() {
    config.value.snapRayAnglesForFree = ['0', '45', '90', '135']
}

function applySnapRayAnglesForFree() {
    const angles = snapRayAnglesForFreeText.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    config.value.snapRayAnglesForFree = angles
}
</script>

<template>
<ConfigSection :title="'自由区间方向'">
    <table><tbody>
        <tr v-if="!snapRayAnglesForFreeEnabled">
            <td>
                <button @click="enableFreeSegmentDirection">启用自由方向</button>
                <div class="explain">
                    <p>启用后，自由点（free 点）将使用独立的延长线吸附角度。</p>
                </div>
            </td>
        </tr>
        <template v-else>
            <tr>
                <td>
                    <textarea v-model="snapRayAnglesForFreeText" rows="4" style="width: 120px;"/><br/>
                    <button class="minor" @click="applySnapRayAnglesForFree">应用</button>
                    <button class="minor" @click="config.snapRayAnglesForFree = []">禁用</button>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="explain">
                        一行一个角度（度），自动取模 180。<br/>
                        例如：0、45、90、135<br/>
                        配置 30 表示 30° 和 210° 方向<br/>
                        清空并应用可禁用自由方向，继续使用普通延长线吸附角度。
                    </div>
                </td>
            </tr>
        </template>
    </tbody></table>
</ConfigSection>
</template>

<style lang="scss" scoped>
textarea{
    width: 120px;
}
</style>
