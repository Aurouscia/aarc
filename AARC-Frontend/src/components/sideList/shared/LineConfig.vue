<script setup lang="ts">
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';

const envStore = useEnvStore()
defineProps<{
    line:Line,
    lineWidthRangeMax?:number
}>()
</script>

<template>
<div class="lineConfig withShadow" @click="e=>e.stopPropagation()">
    <div class="configItem">
        <div>线宽</div>
        <div class="slideBar">
            <input type="range" v-model="line.width" min="0.5" :max="lineWidthRangeMax||2" step="0.25" value="1"
                @change="envStore.lineInfoChanged"/>
            <div>{{ line.width || 1 }}×</div>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.lineConfig{
    background-color: white;
    padding: 10px;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    .configItem{
        display: flex;
        gap: 10px;
        justify-content: space-between;
        align-items: center;
        white-space: nowrap;
        .slideBar{
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0px;
            div{
                color: gray;
                font-size: 12px;
            }
        }
    }
}
</style>