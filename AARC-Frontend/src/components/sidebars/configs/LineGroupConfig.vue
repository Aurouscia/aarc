<script setup lang="ts">
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { onMounted, ref } from 'vue';
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';
import { LineGroup, LineType } from '@/models/save';

const saveStore = useSaveStore();
const { save } = storeToRefs(saveStore);
const { preventLeaving } = usePreventLeavingUnsavedStore() //无需rerender的地方需要手动调用“阻止未保存离开”
onMounted(()=>{
    if(save.value && !save.value?.lineGroups) {
        save.value.lineGroups = [];
    }
})
function moveUp(index: number) {
    if(index > 0){
        const item = save.value?.lineGroups?.splice(index, 1)[0];
        if(item) {
            save.value?.lineGroups?.splice(index - 1, 0, item);
            preventLeaving()
        }
    }
}
function remove(index: number) {
    const target = save.value?.lineGroups?.at(index);
    if(!target)
        return;
    const name = target.name ?? '无名';
    if(window.confirm(`确定删除线路组<${name}>`)){
        save.value?.lineGroups?.splice(index, 1);
        preventLeaving()
    }
}
function toggleLineType(g:LineGroup){
    if(g.lineType === LineType.terrain)
        g.lineType = LineType.common;
    else
        g.lineType = LineType.terrain;
    preventLeaving()
}
function lineTypeStr(g:LineGroup){
    if(g.lineType === LineType.terrain)
        return '地形';
    else
        return '线路';
}
function lineTypeColor(g:LineGroup){
    if(g.lineType === LineType.terrain)
        return 'olivedrab';
    else
        return 'cornflowerblue';
}

const creatingName = ref();
function create() {
    if(!creatingName.value)
        return;
    const newId = saveStore.getNewId()
    save.value?.lineGroups?.push({
        id: newId,
        name: creatingName.value,
        lineType: LineType.common,
    })
    creatingName.value = undefined;
    preventLeaving()
}
</script>

<template>
<ConfigSection :title="'线路组'">
    <table v-if="save?.lineGroups" class="fullWidth"><tbody>
        <tr v-if="save.lineGroups.length>0"><th colspan="2">现有</th></tr>
        <tr v-for="lg,idx in save?.lineGroups">
            <td>
                <input v-model="lg.name"/>
            </td>
            <td class="btns">
                <button @click="toggleLineType(lg)" class="lite" :style="{color:lineTypeColor(lg)}">{{ lineTypeStr(lg) }}</button>
                <button @click="moveUp(idx)" class="lite">上移</button>
                <button @click="remove(idx)" class="lite">删</button>
            </td>
        </tr>
        <tr><th colspan="2">新建</th></tr>
        <tr>
            <td>
                <input v-model="creatingName" placeholder="新建">
            </td>
            <td>
                <button @click="create" class="lite">新建</button>
            </td>
        </tr>
    </tbody></table>
</ConfigSection>
</template>

<style scoped lang="scss">
input{
    width: 120px;
    margin: 5px 0px;
}
button{
    font-size: 13px;
    margin: 0px 5px;
}
</style>