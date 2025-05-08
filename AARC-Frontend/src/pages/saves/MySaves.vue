<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import { useApiStore } from '@/app/com/apiStore';
import SideBar from '@/components/common/SideBar.vue';
import { useEditorsRoutesJump } from '../editors/routes/routesJump';
import { appVersionCheck } from '@/app/appVersionCheck';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import fileDownload from 'js-file-download';
import Loading from '@/components/common/Loading.vue';
import { Save, saveLineCount, saveStaCount } from '@/models/save';
import { guideInfo } from '@/app/guideInfo';
import defaultMini from '@/assets/logo/aarc.svg'
import { SaveDto } from '@/app/com/apiGenerated';

const saveList = ref<SaveDto[]>()
const api = useApiStore();
const { editorRoute } = useEditorsRoutesJump()
const { pop } = useUniqueComponentsStore()
const props = defineProps<{
    uid?:string
}>()
let uidNum = parseInt(props.uid || '')
if(isNaN(uidNum)){
    uidNum = 0
}

const ownerName = ref<string>()
async function load(){
    if(uidNum > 0){
        const ownerInfo = await api.user.getInfo(uidNum)
        ownerName.value = ownerInfo?.name || '??'
    }else{
        ownerName.value = '我'
    }
    saveList.value = await api.save.getMySaves(uidNum)
}

const saveInfoSb = ref<InstanceType<typeof SideBar>>()
const editingSave = ref<SaveDto>()
const isCreatingSave = ref(false)
function startCreating(){
    isCreatingSave.value = true
    editingSave.value = {id:0, name:''}
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
    let p:Promise<boolean|undefined>
    if(isCreatingSave.value)
        p = api.save.add(editingSave.value)
    else
        p = api.save.updateInfo(editingSave.value)
    const success = await p
    if(success){
        saveInfoSb.value?.fold()
        await load()
        pop?.show('操作成功', 'success')
    }
}

const dangerZone = ref(false)
const repeatCvsName = ref("")
const jsonFileInput = ref<HTMLInputElement>()
const jsonContent = ref<string>()
const jsonSaveStaCount = ref<number>()
const jsonSaveLineCount = ref<number>()
async function removeCurrentCvs(){
    if(repeatCvsName.value !== editingSave.value?.name){
        pop?.show('请一字不差输入画布名称', 'failed')
        return
    }
    const resp = await api.save.remove(editingSave.value.id)
    if(resp){
        saveInfoSb.value?.fold()
        await load()
    }
}
function selectReplaceJson(){
    resetReplaceJson()
    const f = jsonFileInput.value?.files?.item(0)
    if(!f)
        return
    if(f.size > 10*1000*1000){
        pop?.show('文件过大', 'failed')
        return
    }
    const reader = new FileReader()
    reader.onload = (e)=>{
        const res = e.target?.result?.toString()
        if(!res){
            pop?.show('文件读取失败', 'failed')
            return
        }
        try{
            const obj = JSON.parse(res) as Save
            jsonSaveStaCount.value = saveStaCount(obj)
            jsonSaveLineCount.value = saveLineCount(obj)
            jsonContent.value = JSON.stringify(obj)
        }catch{
            pop?.show('文件格式异常', 'failed')
            resetReplaceJson()
        }
    }
    reader.readAsText(f)
}
async function commitReplaceJson(){
    if(!editingSave.value || !jsonContent.value)
        return
    const id = editingSave.value.id
    const data = jsonContent.value
    const staCount = jsonSaveStaCount.value || 0
    const lineCount = jsonSaveLineCount.value || 0
    const resp = await api.save.updateData(id, data, staCount, lineCount)
    if(resp)
        resetDangerZone()
}
function resetReplaceJson(){
    jsonSaveLineCount.value = undefined
    jsonSaveStaCount.value = undefined
    jsonContent.value = undefined
}
function resetDangerZone(){
    resetReplaceJson()
    dangerZone.value = false
    repeatCvsName.value = ''
}

async function downloadJson(){
    if(!editingSave.value)
        return
    const json = await api.save.loadData(editingSave.value.id)
    if(json)
        fileDownload(json, `${editingSave.value.name}.aarc.json`)
}

onMounted(async()=>{
    await load()
    await appVersionCheck()
})
</script>

<template>
<h1 v-if="ownerName" class="h1WithBtns">
    {{ ownerName }}的存档
    <div>
        <button @click="startCreating">新建</button>
    </div>
</h1>
<div style="overflow-x: auto;">
<table v-if="saveList" class="fullWidth index"><tbody>
    <tr>
        <th style="width: 100px;"></th>
        <th style="min-width: 200px;">名称</th>
        <th style="width: 130px;min-width: 130px">上次更新</th>
        <th style="width: 100px;min-width: 100px"></th>
    </tr>
    <tr v-for="s in saveList">
        <td>
            <img :src="s.miniUrl || defaultMini" class="mini"/>
        </td>
        <td>
            {{ s.name }}
            <div class="dataInfo">{{ s.lineCount }}线 {{ s.staCount }}站</div>
        </td>
        <td>
            <div class="lastActive">{{ s.lastActive }}</div>
        </td>
        <td>
            <button class="minor" @click="startEditingInfo(s)">信息</button>
            <RouterLink :to="editorRoute(s.id??0)"><button>编辑</button></RouterLink>
        </td>
    </tr>
    <tr v-if="saveList.length==0" style="color: #666; font-size: 16px;">
        <td colspan="4">暂无存档</td>
    </tr>
    <tr v-if="guideInfo.findHelp" style="color: #666; font-size: 14px;">
        <td colspan="4">{{ guideInfo.findHelp }}</td>
    </tr>
</tbody></table>
<Loading v-else></Loading>
</div>
<SideBar ref="saveInfoSb" @extend="resetDangerZone" class="saveInfoSb">
    <h1>{{ isCreatingSave ? '创建存档':'编辑信息' }}</h1>
    <table v-if="editingSave"><tbody>
        <tr>
            <td colspan="2">
                <img :src="editingSave.miniUrl || defaultMini" class="miniInSidebar"/>
            </td>
        </tr>
        <tr>
            <td>名称</td>
            <td>
                <input v-model="editingSave.name"/>
            </td>
        </tr>
        <tr>
            <td>简介</td>
            <td>
                <textarea v-model="editingSave.intro" placeholder="最多256字符" rows="5"></textarea>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <button @click="done">{{ isCreatingSave ? '创建存档':'保存更改' }}</button>
            </td>
        </tr>
    </tbody></table>
    <table v-if="!isCreatingSave"><tbody>
        <tr>
            <td>
                <button class="minor downloadJsonBtn" @click="downloadJson">导出工程文件</button>
            </td>
        </tr>
    </tbody></table>
    <table v-if="!isCreatingSave"><tbody>
        <tr><td>
        <button class="minor dangerZoneBtn" @click="dangerZone = !dangerZone">危险区</button>
        <div v-show="dangerZone" class="dangerZone">
            <div class="dangerOpName">
                替换存档数据
            </div>
            <input type="file" ref="jsonFileInput" accept=".json" @change="selectReplaceJson"/>
            <div v-show="jsonContent" class="replaceJsonInfo">
                [{{ jsonSaveLineCount }}线 {{ jsonSaveStaCount }}站]
                <div>存档数据将被覆盖，注意核对名称</div>
            </div>
            <button v-show="jsonContent" class="danger" @click="commitReplaceJson">替换数据</button>
        </div>
        <div v-show="dangerZone" class="dangerZone">
            <div class="dangerOpName">删除存档</div>
            <input v-model="repeatCvsName" placeholder="输入本存档名称"/>
            <button v-show="repeatCvsName" class="danger" @click="removeCurrentCvs">删除存档</button>
        </div>
        </td></tr>
    </tbody></table>
</SideBar>
</template>

<style scoped lang="scss">
.mini{
    border-radius: 5px;
    height: 90px;
    width: 90px;
}
.miniInSidebar{
    border-radius: 10px;
    height: 160px;
    width: 160px;
}

.dataInfo{
    font-size: 14px;
    color: #666;
    margin-top: 5px;
}
.lastActive{
    font-size: 14px;
}

.saveInfoSb{
    input, textarea{
        width: 180px;
    }
    table{
        width: 100%;
        margin-bottom: 10px;
    }
    .downloadJsonBtn{
        display: block;
        margin: auto;
    }
    .replaceJsonInfo{
        text-align: center;
        font-size: 14px;
        color: #333
    }
    .dangerZoneBtn{
        display: block;
        margin: auto;
    }
    .dangerOpName{
        text-align: center;
        color: red;
    }
}
</style>