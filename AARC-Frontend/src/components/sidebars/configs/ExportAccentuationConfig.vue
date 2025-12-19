<script setup lang="ts">
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { useRenderOptionsStore } from '@/models/stores/renderOptionsStore';
import { computed, onMounted, ref, watch } from 'vue';
import { Line, LineType } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import sortLinesByName from '@/utils/lineUtils/sortLinesByName';
import { useEnvStore } from '@/models/stores/envStore';

const saveStore = useSaveStore()
const envStore = useEnvStore()
const { accentuationEnabled, accentuationLineIds, accentuationConfig } = storeToRefs(useRenderOptionsStore())

const addingLineId = ref<number>(-1)
const selectedLines = ref<Line[]>([])
function handleSelectChange(){
    if(addingLineId.value > 0){
        const line = saveStore.getLineById(addingLineId.value)
        if(line && selectedLines.value.indexOf(line) < 0){
            selectedLines.value.push(line)
            syncToAccIds()
        }
        addingLineId.value = -1
    }
}
function removeLine(line: Line){
    selectedLines.value = selectedLines.value.filter(l => l !== line)
    syncToAccIds()
}

watch(()=>({ 
    enabled: accentuationEnabled.value, 
    ids:accentuationLineIds.value,
    cfg: accentuationConfig.value
}), ()=>{
    if(accentuationConfig.value.enabledPreview){
        envStore.rerender([], [])
    }
}, { deep: true })

const linesForSelect = computed(()=>{
    if(!saveStore.save?.lines)
        return []
    const lines = saveStore.save.lines.filter(l => l.type == LineType.common && !l.parent && !accentuationLineIds.value.includes(l.id))
    // 按名称排序（如果以数字开头，则按其数字升序排序，有数字的排在没数字的前面）
    sortLinesByName(lines)
    return lines
})

function syncToAccIds(){
    accentuationLineIds.value = [...selectedLines.value.map(l => l.id)]
}
function syncFromAccIds(){
    for(const id of accentuationLineIds.value){
        const line = saveStore.getLineById(id)
        if(line && selectedLines.value.indexOf(line) < 0){
            selectedLines.value.push(line)
        }
    }
}

onMounted(()=>{
    syncFromAccIds()
})
</script>

<template>
<ConfigSection :title="'线路突出强调（新）'">
    <table class="fullWidth"><tbody>
        <tr>
            <td colspan="2">
                <button :class="accentuationEnabled?'confirm':'off'" @click="accentuationEnabled = !accentuationEnabled">
                    {{ accentuationEnabled ? '已经启用':'点击启用' }}
                </button>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <select @change="handleSelectChange" v-model="addingLineId">
                    <option :value="-1">点击添加目标</option>
                    <option v-for="l in linesForSelect" :value="l.id">{{ l.name }}</option>
                </select>
                <div class="acc-lines-selected">
                    <div v-for="line in selectedLines">
                        <div class="acc-line-name">
                            {{ line.name }}
                        </div>
                        <button class="lite" @click="removeLine(line)">×</button>
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="smallNote">
                    仅下方的设置会保存在浏览器中
                </div>
            </td>
        </tr>
        <tr>
            <td style="width: 120px;">预览</td>
            <td>
                <input v-model="accentuationConfig.enabledPreview" type="checkbox"/>
            </td>
        </tr>
        <tr>
            <td>同色扩展目标</td>
            <td>
                <input v-model="accentuationConfig.spread" type="checkbox"/>
            </td>
        </tr>
        <tr>
            <td>包括地形</td>
            <td>
                <input v-model="accentuationConfig.terrain" type="checkbox"/>
            </td>
        </tr>
    </tbody></table>
</ConfigSection>
</template>

<style scoped lang="scss">
.acc-lines-selected{
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 5px;
    &>div{
        display: flex;
        align-items: center;
        gap: 5px;
        background-color: white;
        color: #666;
        padding: 3px 5px;
        border-radius: 5px;
        &>button{
            color: #666;
        }
    }
}
</style>