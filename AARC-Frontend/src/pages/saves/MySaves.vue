<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import { SaveDto } from './models/models';
import { useApiStore } from '@/app/com/api';
import SideBar from '@/components/common/SideBar.vue';
import { useEditorsRoutesJump } from '../editors/routes/routesJump';
import { appVersionCheck } from '@/app/appVersionCheck';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import fileDownload from 'js-file-download';
import Loading from '@/components/common/Loading.vue';

const saveList = ref<SaveDto[]>()
const api = useApiStore().get()
const { editorRoute } = useEditorsRoutesJump()
const { pop } = useUniqueComponentsStore()

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

const dangerZone = ref(false)
const repeatCvsName = ref("")
async function removeCurrentCvs(){
    if(repeatCvsName.value !== editingSave.value?.Name){
        pop?.show('请一字不差输入画布名称', 'failed')
        return
    }
    const resp = await api.save.remove(editingSave.value.Id)
    if(resp){
        saveInfoSb.value?.fold()
        await load()
    }
}
function resetDangerZone(){
    dangerZone.value = false
    repeatCvsName.value = ''
}

async function downloadJson(){
    if(!editingSave.value)
        return
    const json = await api.save.loadData(editingSave.value.Id)
    fileDownload(json, `${editingSave.value.Name}.aarc.json`)
}

onMounted(async()=>{
    await load()
    await appVersionCheck()
})
</script>

<template>
<h1 class="h1WithBtns">
    我的存档
    <div>
        <button @click="startCreating">新建</button>
    </div>
</h1>
<div style="overflow-x: auto;">
<table v-if="saveList" class="fullWidth"><tbody>
    <tr>
        <th style="min-width: 200px;">名称</th>
        <th style="width: 130px;min-width: 130px">上次更新</th>
        <th style="width: 100px;min-width: 100px"></th>
    </tr>
    <tr v-for="s in saveList">
        <td>
            {{ s.Name }}
            <div class="dataInfo">{{ s.LineCount }}线 {{ s.StaCount }}站</div>
        </td>
        <td>
            <div class="lastActive">{{ s.LastActive }}</div>
        </td>
        <td>
            <button class="minor" @click="startEditingInfo(s)">信息</button>
            <RouterLink :to="editorRoute(s.Id)"><button>编辑</button></RouterLink>
        </td>
    </tr>
</tbody></table>
<Loading v-else></Loading>
</div>
<SideBar ref="saveInfoSb" @extend="resetDangerZone">
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
        <tr>
            <td colspan="2">
                <button @click="done">{{ isCreatingSave ? '创建存档':'保存更改' }}</button>
            </td>
        </tr>
    </tbody></table>
    <hr/>
    <div v-if="!isCreatingSave">
        <button class="minor downloadJsonBtn" @click="downloadJson">导出工程文件</button>
    </div>
    <hr/>
    <div v-if="!isCreatingSave">
        <button class="minor removeCvsBtn" @click="dangerZone = !dangerZone">危险区</button>
        <div v-if="dangerZone" class="dangerZone">
            <input v-model="repeatCvsName" placeholder="输入本存档名称"/>
            <button class="danger" @click="removeCurrentCvs">删除存档</button>
        </div>
    </div>
</SideBar>
</template>

<style scoped lang="scss">
.dataInfo{
    font-size: 12px;
    color: #333;
}
.lastActive{
    font-size: 14px;
}

table{
    width: 100%;
}
.downloadJsonBtn{
    display: block;
    margin: auto;
}
.removeCvsBtn{
    display: block;
    margin: auto;
    margin-bottom: 10px;
}
</style>