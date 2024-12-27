<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import { SaveDto } from './models/models';
import { useApiStore } from '@/utils/app/com/api';
import SideBar from '@/components/common/SideBar.vue';

const saveList = ref<SaveDto[]>()
const api = useApiStore().get()
async function load(){
    saveList.value = await api.save.getMySaves()
}

const saveInfoSb = ref<InstanceType<typeof SideBar>>()
const editingSave = ref<SaveDto>()
const isCreatingSave = ref(false)
function startCreating(){
    isCreatingSave.value = true
    editingSave.value = {Id:0, Name:''}
    nextTick(()=>saveInfoSb.value?.extend())
}
function startEditingInfo(s:SaveDto){
    isCreatingSave.value = false
    editingSave.value = s
    nextTick(()=>saveInfoSb.value?.extend())
}
async function done(){
    if(!editingSave.value)
        return
    let p:Promise<boolean>
    if(isCreatingSave.value)
        p = api.save.add(editingSave.value)
    else
        p = api.save.updateInfo(editingSave.value)
    const success = await p
    if(success){
        saveInfoSb.value?.fold()
        await load()
    }
}

onMounted(async()=>{
    await load()
})
</script>

<template>
<h1 class="h1WithBtns">
    我的存档
    <div>
        <button @click="startCreating">新建</button>
    </div>
</h1>
<table class="fullWidth"><tbody>
    <tr>
        <th>名称</th>
        <th style="width: 200px;">上次更新</th>
        <th style="width: 150px;"></th>
    </tr>
    <tr v-for="s in saveList">
        <td>
            {{ s.Name }}
        </td>
        <td>
            {{ s.LastActive }}
        </td>
        <td>
            <button class="minor" @click="startEditingInfo(s)">信息</button>
        </td>
    </tr>
</tbody></table>
<SideBar ref="saveInfoSb">
    <h1>{{ isCreatingSave ? '创建存档':'编辑信息' }}</h1>
    <table v-if="editingSave"><tbody>
        <tr>
            <td>名称</td>
            <td>
                <input v-model="editingSave.Name"/>
            </td>
        </tr>
        <tr>
            <td>简介</td>
            <td>
                <textarea v-model="editingSave.Intro" placeholder="最多256字符" rows="5"></textarea>
            </td>
        </tr>
        <tr class="noBg">
            <td colspan="2">
                <button @click="done">{{ isCreatingSave ? '创建':'保存' }}</button>
            </td>
        </tr>
    </tbody></table>
</SideBar>
</template>

<style scoped lang="scss">

</style>