<script setup lang="ts">
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { useRenderOptionsStore } from '@/models/stores/renderOptionsStore';
import { computed, onMounted, ref, watch } from 'vue';
import { Line, LineType } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import sortLinesByName from '@/utils/lineUtils/sortLinesByName';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';

const saveStore = useSaveStore()
const mainCvsDispatcher = useMainCvsDispatcher()
const { accentuationEnabled, accentuationLineIds, accentuationConfig } = storeToRefs(useRenderOptionsStore())

const addingLineId = ref<number>(-1)
const selectedLines = ref<Line[]>([])
async function handleSelectChange(){
    let adding = addingLineId.value // 存储选中值
    if(adding == -1)
        return
    addingLineId.value = -1; // 复位
    await new Promise(r=>window.setTimeout(r, 100))
    if(adding > 0){
        const line = saveStore.getLineById(adding)
        if(line && selectedLines.value.indexOf(line) < 0){
            selectedLines.value.push(line)
            syncToAccIds()
        }
    }
    else if(adding == -2){
        // 选项中，-2表示添加整个组
        for(const line of linesForSelect.value){
            if(selectedLines.value.indexOf(line) < 0){
                selectedLines.value.push(line)
            }
        }
        syncToAccIds()
    }
}
function removeLine(line: Line){
    selectedLines.value = selectedLines.value.filter(l => l !== line)
    syncToAccIds()
}
function removeAll(){
    selectedLines.value = []
    syncToAccIds()
}

watch(()=>({ 
    enabled: accentuationEnabled.value, 
    ids: accentuationLineIds.value,
    cfg: accentuationConfig.value
}), ()=>{
    if(accentuationConfig.value.enabledPreview){
        mainCvsDispatcher.renderMainCvs({suppressRenderedCallback:true})
    }
}, { deep: true })
watch(()=>accentuationConfig.value.enabledPreview, (newVal, oldVal)=>{
    if(!newVal && oldVal){
        mainCvsDispatcher.renderMainCvs({suppressRenderedCallback:true})
    }
})

const addingLineGroupId = ref<number>(-1)
const lineGroupsForSelect = computed(()=>{
    if(!saveStore.save?.lineGroups)
        return []
    return saveStore.save.lineGroups.filter(l => l.lineType == LineType.common)
})
const linesForSelect = computed(()=>{
    if(!saveStore.save?.lines)
        return []
    let lines = saveStore.save.lines.filter(l => l.type == LineType.common && !l.parent && !accentuationLineIds.value.includes(l.id))
    if(addingLineGroupId.value > -1){
        lines = lines.filter(l => (l.group ?? 0) == addingLineGroupId.value)
    }
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
<ConfigSection :title="'线路突出强调✨'">
    <table class="fullWidth"><tbody>
        <!-- <tr> 目前没什么用，也许以后有了更细粒度的持久化（每个画布）再加回来
            <td colspan="2">
                <button :class="accentuationEnabled?'confirm':'off'" @click="accentuationEnabled = !accentuationEnabled">
                    {{ accentuationEnabled ? '已经启用':'点击启用' }}
                </button>
            </td>
        </tr> -->
        <tr>
            <td colspan="2">
                <select v-model="addingLineGroupId">
                    <option :value="-1">所有线路组</option>
                    <option :value="0">默认分组</option>
                    <option v-for="g in lineGroupsForSelect" :value="g.id">{{ g.name }}</option>
                </select><br/>
                <select @change="handleSelectChange" v-model="addingLineId">
                    <option :value="-1">点击添加目标线路</option>
                    <option v-if="addingLineGroupId > -1 && linesForSelect.length > 1" :value="-2">&lt;添加整个组&gt;</option>
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
                <button v-if="selectedLines.length>0" class="lite cancel" style="margin-top: 10px;"
                    @click="removeAll">清空所有</button>
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
            <td>扩展同色目标</td>
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