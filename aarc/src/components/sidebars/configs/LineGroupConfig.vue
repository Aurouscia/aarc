<script setup lang="ts">
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { onMounted, ref } from 'vue';
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';
import { LineType } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';

const saveStore = useSaveStore();
const { save } = storeToRefs(saveStore);
const envStore = useEnvStore()
const { preventLeaving } = usePreventLeavingUnsavedStore() //无需rerender的地方需要手动调用“阻止未保存离开”
onMounted(()=>{
    if(save.value && !save.value?.lineGroups) {
        save.value.lineGroups = [];
    }
})
const orderChanged = ref(false)
function moveUp(index: number) {
    if(index > 0){
        const item = save.value?.lineGroups?.splice(index, 1)[0];
        if(item) {
            save.value?.lineGroups?.splice(index - 1, 0, item);
            preventLeaving()
            saveStore.ensureLinesOrdered()
            orderChanged.value = true;
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
function toggleCreatingLineType(){
    if(creatingType.value === LineType.terrain)
        creatingType.value = LineType.common;
    else
        creatingType.value = LineType.terrain;
    preventLeaving()
}
function lineTypeStr(t:LineType){
    if(t === LineType.terrain)
        return '地形';
    else
        return '线路';
}
function lineTypeColor(t:LineType){
    if(t === LineType.terrain)
        return 'olivedrab';
    else
        return 'cornflowerblue';
}

const creatingName = ref();
const creatingType = ref<LineType>(LineType.common)
function create() {
    if(!creatingName.value)
        return;
    const newId = saveStore.getNewId()
    save.value?.lineGroups?.push({
        id: newId,
        name: creatingName.value,
        lineType: creatingType.value,
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
                <span :style="{color:lineTypeColor(lg.lineType)}">{{ lineTypeStr(lg.lineType) }}</span>
                <button @click="moveUp(idx)" class="lite">上移</button>
                <button @click="remove(idx)" class="lite">删</button>
            </td>
        </tr>
        <tr v-if="orderChanged">
            <td colspan="2">
                <button class="ok" @click="envStore.rerender();orderChanged=false">确认调序</button>
            </td>
        </tr>
        <tr><th colspan="2">新建</th></tr>
        <tr>
            <td>
                <input v-model="creatingName" placeholder="新建">
            </td>
            <td class="btns">
                <button @click="toggleCreatingLineType" class="lite" :style="{color:lineTypeColor(creatingType)}">
                    {{ lineTypeStr(creatingType) }}
                </button>
                <button @click="create" class="lite">新建</button>
            </td>
        </tr>
        <tr>
            <td colspan="2" class="smallNote">
                “新建”按钮左侧的按钮<br/>可切换新建线路组的类型
            </td>
        </tr>
        <tr>
            <td colspan="2" class="smallNote">
                线路组删除后<br/>该组内的线路将被移至默认分组
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
.btns{
    button, span{
        font-size: 13px;
        margin: 0px 5px;
        vertical-align: middle;
    }
}
</style>