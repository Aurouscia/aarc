<script setup lang="ts">
import { onMounted, ref, nextTick, computed, watch } from 'vue';
import { useApiStore } from '@/app/com/apiStore';
import SideBar from '@/components/common/SideBar.vue';
import { useEditorsRoutesJump } from '../editors/routes/routesJump';
import { appVersionCheck } from '@/app/appVersionCheck';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import fileDownload from 'js-file-download';
import Loading from '@/components/common/Loading.vue';
import { Save, saveLineCount, saveStaCount } from '@/models/save';
import { guideInfo } from '@/app/guideInfo';
import defaultMini from '@/assets/defaultMini.svg'
import { SaveDto } from '@/app/com/apiGenerated';
import { WithIntroShow } from '@/utils/type/WithIntroShow';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useEnteredCanvasFromStore } from '@/app/globalStores/enteredCanvasFrom';

const saveList = ref<WithIntroShow<SaveDto>[]>()
const api = useApiStore();
const { editorRoute } = useEditorsRoutesJump()
const { pop } = useUniqueComponentsStore()
const userInfoStore = useUserInfoStore()
const props = defineProps<{
    uid?:string
}>()
const uidNum = computed<number>(()=>{
    const uid = parseInt(props.uid || '')
    if(isNaN(uid)){
        return 0
    }
    if(uid && userInfoStore.userInfo.id === uid){
        //如果是当前登录用户的id，直接变成“我的”
        return 0
    }
    return uid
})
const isMine = computed<boolean>(()=>uidNum.value===0)
watch(uidNum, load)

const ownerName = ref<string>()
async function load(){
    if(uidNum.value > 0){
        const ownerInfo = await api.user.getInfo(uidNum.value)
        ownerName.value = ownerInfo?.name || '??'
    }else{
        ownerName.value = '我'
    }
    saveList.value = await api.save.getMySaves(uidNum.value)
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
    if(resp){
        pop?.show('替换成功\n下次保存更新略缩图', 'success')
        resetDangerZone()
    }
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

const { setEnteredFrom } = useEnteredCanvasFromStore()
onMounted(async()=>{
    setEnteredFrom()
    await load()
    await appVersionCheck()
})
</script>

<template>
<h1 v-if="ownerName" class="h1WithBtns">
    <span v-if="isMine">我的存档</span>
    <span v-else><span class="ownerNameInH1">{{ ownerName }}</span>的存档</span>
    <div v-if="isMine">
        <button @click="startCreating">新建</button>
    </div>
</h1>
<div style="overflow-x: auto;">
<table v-if="saveList" class="fullWidth index saveList"><tbody>
    <tr>
        <th style="width: 100px;min-width: 100px">点击进入</th>
        <th style="min-width: 200px;">
            名称
            <span class="introNote">简介点击展开</span>
        </th>
        <th style="width: 130px;min-width: 130px">上次更新</th>
        <th style="width: 80px;min-width: 80px"></th>
    </tr>
    <tr v-for="s in saveList">
        <td>
            <RouterLink :to="editorRoute(s.id??0)">
                <img :src="s.miniUrl || defaultMini" class="mini"/>
            </RouterLink>
        </td>
        <td>
            {{ s.name }}
            <div v-if="s.intro" class="itemIntro" :class="{nowrapEllipsis:!s.introShow}" @click="s.introShow=!s.introShow">
                {{ s.intro }}
            </div>
            <div class="dataInfo">—{{ s.lineCount }}线 {{ s.staCount }}站—</div>
        </td>
        <td>
            <div class="lastActive">{{ s.lastActive }}</div>
        </td>
        <td>
            <button v-if="isMine" class="minor" @click="startEditingInfo(s)">信息设置</button>
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
    <h1>{{ isCreatingSave ? '创建存档':'信息设置' }}</h1>
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
                <div>存档数据将被覆盖<br/>注意核对名称</div>
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
.ownerNameInH1{
    letter-spacing: normal;
    margin-right: 0.1em;
}

.miniInSidebar{
    border-radius: 10px;
    height: 160px;
    width: 160px;
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