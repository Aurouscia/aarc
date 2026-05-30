<script setup lang="ts">
import ConfigSection from './shared/ConfigSection.vue';
import { storeToRefs } from 'pinia';
import { useConfigStore } from '@/models/stores/configStore';
import { clamp } from '@/utils/lang/clamp';
import { useEnvStore } from '@/models/stores/envStore';
import { onMounted } from 'vue';

const envStore = useEnvStore()
const { config } = storeToRefs(useConfigStore())
function applyLineWidthMapped(width:string, setItem:'staSize'|'staNameSize'|'staSnapSize'|'staNameSnapSize', value?:string){
    config.value.lineWidthMapped ??= {}
    const valueNum = value ? parseFloat(value) : NaN
    const lwm = config.value.lineWidthMapped
    if(!lwm[width])
        lwm[width] = {}
    if(!isNaN(valueNum))
        lwm[width][setItem] = clamp(valueNum, 0.1, 3)
    else
        lwm[width][setItem] = undefined
    envStore.rerender([], undefined)
}

onMounted(()=>{
    config.value.lineWidthMapped ??= {}
})
</script>

<template>
<ConfigSection :title="'线宽对应参数（新）'">
<div class="lineWidthMappedOuter">
    <table class="fullWidth lineWidthMapped">
        <tbody>
        <tr>
            <td class="explain" colspan="5">
                设置特定宽度的线路对应的<br/>车站尺寸/站名/吸附大小<br/>
                (会被线路单独设置覆盖)
            </td>
        </tr>
        <tr>
            <th></th>
            <th>车站</th>
            <th>站名</th>
            <th>吸附</th>
            <th>站名吸附</th>
        </tr>
        <tr v-for="width in ['0.5', '0.75', '1', '1.25', '1.5', '1.75', '2']">
            <td>{{ width }}</td>
            <td>
                <input :value="config.lineWidthMapped[width]?.staSize" :placeholder="width"
                    @blur="e=>applyLineWidthMapped(width, 'staSize', (e.target as HTMLInputElement).value)"/>
            </td>
            <td>
                <input :value="config.lineWidthMapped[width]?.staNameSize" :placeholder="width"
                    @blur="e=>applyLineWidthMapped(width, 'staNameSize', (e.target as HTMLInputElement).value)"/>
            </td>
            <td>
                <input :value="config.lineWidthMapped[width]?.staSnapSize" :placeholder="width"
                    @blur="e=>applyLineWidthMapped(width, 'staSnapSize', (e.target as HTMLInputElement).value)"/>
            </td>
            <td>
                <input :value="config.lineWidthMapped[width]?.staNameSnapSize" :placeholder="width"
                    @blur="e=>applyLineWidthMapped(width, 'staNameSnapSize', (e.target as HTMLInputElement).value)"/>
            </td>
        </tr>
        <tr>
            <td class="explain" colspan="5">
                调小车站尺寸和吸附距离可能会造成<br/>
                换乘站脱离，请手动拼合脱离处
            </td>
        </tr>
    </tbody></table>
</div>
</ConfigSection>
</template>

<style lang="scss" scoped>
.lineWidthMappedOuter{
    width: 100%;
    overflow-x: auto;
}
.lineWidthMapped{
    input{
        width: 75px;
        margin: 0px;
        &::placeholder {
            color: #aaa;
        }
    }
}
.explain{
    text-align: left;
}
</style>