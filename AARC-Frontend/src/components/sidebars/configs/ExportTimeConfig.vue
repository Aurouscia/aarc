<script setup lang="ts">
import { ref, watch } from 'vue';
import ConfigSection from './shared/ConfigSection.vue';
import { storeToRefs } from 'pinia';
import { useRenderOptionsStore } from '@/models/stores/renderOptionsStore';
import { fromYMD } from '@/utils/timeUtils/timeStr';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';

const { showPop } = useUniqueComponentsStore()
const mainCvsDispatcher = useMainCvsDispatcher()
const { timeMoment, timeConfig } = storeToRefs(useRenderOptionsStore())
const momentStr = ref<string>()

watch(()=>({  
    time: timeMoment.value,
    cfg: timeConfig.value
}), ()=>{
    if(timeConfig.value.enabledPreview){
        mainCvsDispatcher.renderMainCvs({suppressRenderedCallback:true})
    }
}, { deep: true })
watch(()=>timeConfig.value.enabledPreview, (newVal, oldVal)=>{
    if(!newVal && oldVal){
        mainCvsDispatcher.renderMainCvs({suppressRenderedCallback:true})
    }
})

watch(()=>momentStr.value, (newVal)=>{
    timeMoment.value = fromYMD(newVal, x=>showPop(x, 'failed'))
})
</script>

<template>
<ConfigSection :title="'导出时间点'">
<table class="fullWidth"><tbody>
    <tr>
        <td style="width: 120px;">
            预览
        </td>
        <td>
            <input v-model="timeConfig.enabledPreview" type="checkbox"/>
        </td>
    </tr>
    <tr>
        <td colspan="2">
            <input v-model.lazy="momentStr" placeholder="YYYY-MM-DD"/>
        </td>
    </tr>
    <tr>
        <td colspan="2" class="smallNote" style="text-align: left;">
            可填写：2015（仅年份）<br/>
            或：2015-3（年-月）<br/>
            或：2015-3-15（年-月-日）
        </td>
    </tr>
</tbody></table>
</ConfigSection>
</template>