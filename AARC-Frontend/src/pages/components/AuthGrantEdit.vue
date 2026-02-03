<script setup lang="ts">
import { AuthGrant, AuthGrantOn, AuthGrantTo, AuthGrantTypeOfSave, UserDtoSimple } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { useNameMapStore } from '@/app/globalStores/nameMap';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { computed, onMounted, ref, watch } from 'vue';
import UserSelect from './UserSelect.vue';
import Prompt from '@/components/common/Prompt.vue';

const props = defineProps<{
    on: AuthGrantOn,
    onId: number,
    type: number
}>()
interface AuthGrantDisplay extends AuthGrant {
    flagText: string
    flagColor: string
    toText: string
    toName?: string
}
const apiStore = useApiStore()
const userInfoStore = useUserInfoStore()
const { showPop } = useUniqueComponentsStore()
const nameMapStore = useNameMapStore()

const list = ref<AuthGrant[]>([])
const authGrantToText = new Map<AuthGrantTo|undefined, string>([
    [AuthGrantTo.All, '任何人'],
    [AuthGrantTo.AllMembers, '会员'],
    [AuthGrantTo.User, '某用户']
])
const listDisplay = computed<AuthGrantDisplay[]>(() => {
    return list.value.map((ag) => {
        let toName = undefined
        if(ag.to == AuthGrantTo.User){
            toName = nameMapStore.userNameMap.get(ag.toId ?? 0)
        }
        return {
            ...ag,
            flagText: ag.flag ? '允许' : '拒绝',
            flagColor: ag.flag? 'green' : 'red',
            toText: authGrantToText.get(ag.to) ?? '??',
            toName: toName
        }
    })
})

async function moveUp(ag:AuthGrant){
    const index = list.value.findIndex((x) => x.id === ag.id)
    if(index > 0){
        list.value.splice(index, 1)
        list.value.splice(index-1, 0, ag)
    }
    const ids = list.value.map((ag) => ag.id ?? 0)
    await apiStore.authGrant.setPriorities(props.on, props.onId, props.type, ids)
    showPop('已调整顺序','success')
}
async function del(ag:AuthGrantDisplay){
    let msg = `要取消“${ag.flagText}${ag.toName || ag.toText}”吗？`
    if(!window.confirm(msg))
        return
    const success = await apiStore.authGrant.remove(ag)
    if(success){
        await load()
        showPop('删除成功', 'success')
    }
}

const wantAdd = ref(false)
const newAg = ref<AuthGrant>(createNewAg())
function createNewAg(): AuthGrant{
    return {
        flag: true,
        to: AuthGrantTo.All,
        on: props.on,
        onId: props.onId,
        type: props.type,
    }
}

const userSelectShow = ref(false)
function userSelectSelected(u?:UserDtoSimple){
    userSelectShow.value = false
    if(!u){
        newAg.value.to = AuthGrantTo.All
        wantAdd.value = false
        return;
    }
    if(!u.id || !u.name) return
    newAg.value.toId = u.id
    nameMapStore.appendToMap('userNameMap', u.id, u.name)
}
watch(()=>newAg.value.to, (to) => {
    if(to == AuthGrantTo.User){
        userSelectShow.value = true
    }else{
        newAg.value.toId = 0
    }
})
const newAgToName = computed(() => {
    if(!newAg.value.toId)
        return ''
    if(newAg.value.to == AuthGrantTo.User){
        return nameMapStore.userNameMap.get(newAg.value.toId)
    }
})

const showAllowAllWarning = ref(false)
async function add(){
    if(isSaveEdit.value && newAg.value.to == AuthGrantTo.All && newAg.value.flag){
        if(!showAllowAllWarning.value){
            showAllowAllWarning.value = true
            return
        }else{
            showAllowAllWarning.value = false
        }
    }
    if(props.onId == 0){
        newAg.value.userId = userInfoStore.userInfo.id
    }
    const success = await apiStore.authGrant.create(newAg.value)
    if(success){
        newAg.value = createNewAg()
        await load()
        showPop('新增成功','success')
        wantAdd.value = false
    }
}
async function load() {
    const data = await apiStore.authGrant.load(props.on, props.onId, props.type)
    if(data){
        list.value = data
        const uids = data.filter(x=>x.to == AuthGrantTo.User).map(x=>x.toId ?? 0)
        if(uids.length > 0){
            nameMapStore.ensureLoaded('userNameMap', uids)
        }
    }
}

const isSaveEdit = computed(()=>{
    return props.on == AuthGrantOn.Save && props.type == AuthGrantTypeOfSave.Edit
})

onMounted(async() => {
    await load()
})
</script>

<template>
<table class="fullWidth"><tbody>
    <tr v-for="ag,idx in listDisplay">
        <td style="width: 70px;" :style="{color: ag.flagColor}">
            {{ ag.flagText }}
        </td>
        <td>
            {{ ag.toText }}
            <div v-if="ag.toName" class="ag-to-name">
                {{ ag.toName }}
            </div>
        </td>
        <td class="ag-ops">
            <button class="lite" v-if="idx>0" @click="moveUp(ag)">上移</button>
            <button class="lite" @click="del(ag)">删</button>
        </td>
    </tr>
    <tr v-if="wantAdd">
        <td>
            <select v-model="newAg.flag">
                <option :value="true">允许</option>
                <option :value="false">拒绝</option>
            </select>
        </td>
        <td>
            <select v-model="newAg.to">
                <option :value="AuthGrantTo.All">
                    {{ authGrantToText.get(AuthGrantTo.All) }}
                </option>
                <option :value="AuthGrantTo.AllMembers">
                    {{ authGrantToText.get(AuthGrantTo.AllMembers) }}
                </option>
                <option :value="AuthGrantTo.User">
                    {{ authGrantToText.get(AuthGrantTo.User) }}
                </option>
            </select>
            <div v-if="newAgToName" class="ag-to-name">
                {{ newAgToName }}
            </div>
            <UserSelect v-if="userSelectShow" @select="userSelectSelected"></UserSelect>
        </td>
        <td style="width: 45px;">
            <button class="lite confirm" @click="add">新增</button>
        </td>
    </tr>
    <tr>
        <td colspan="3" v-if="!wantAdd">
            <button class="lite confirm" @click="wantAdd=true">新增授权设置</button>
        </td>
        <td colspan="3" v-else-if="isSaveEdit">
            <div class="smallNoteVital about-save-edit">
                <p>允许他人编辑存档：</p>
                <p>1. 看到绿色的“可编辑”标识才能进入，如果添加授权设置后，被授权者依然未看到标识，请告诉他刷新页面</p>
                <p>2. 请告诉你的协作者：<b>务必在离开页面前保存并退出编辑器</b>，把浏览器切到后台挂机时间太久（数分钟），会允许他人进入，导致先进入的人无法保存</p>
                <p>3. 请告诉你的协作者：黄色的“占用中”状态时，点击“占用中”标识，可以刷新状态（检查他人是否退出）</p>
                <p>4. <b>强烈建议</b>在你准备离开前的最后一次保存时，在工具栏勾选“强制生成备份”，以确保被他人破坏后能恢复</p>
                <p>5. 如果遇到破坏存档的情况，请向管理员举报</p>
            </div>
        </td>
        <td colspan="3" v-else>
            <div class="smallNote">
                下方的会覆盖上方的，例如：<br/>
                允许会员，再拒绝某用户，相当于仅拒绝某用户<br/>
                拒绝某用户，再允许会员，对某用户的拒绝无效
            </div>
        </td>
    </tr>
</tbody></table>
<Prompt v-if="showAllowAllWarning" :close-btn="'我已理解其中风险'" :close-btn-delay="20" @close="add">
    <p>允许所有人编辑存档：这包括未转为会员的游客身份用户</p>
    <p>如果存档受到破坏，无法对破坏者进行任何遏止或处罚，因为注册新号并没有门槛</p>
    <p>设置此项意味着你认为自己的存档毫无价值，只是玩玩而已</p>
    <p style="color: red">建议：改为使用“允许某用户”（可以允许某游客）或使用“允许会员”</p>
    <button class="cancel" @click="showAllowAllWarning=false" style="display: block;margin: 10px auto;">
        退出
    </button>
</Prompt>
</template>

<style scoped lang="scss">
select{
    margin: 0px;
}
.ag-ops{
    text-align: right;
    width: 65px;
    button{
        margin: 0px 4px;
    }
}
.ag-to-name{
    font-size: 14px;
    max-width: 90px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #666;
    margin: auto;
}
.about-save-edit{
    padding: 3px;
    background-color: white;
    text-align: left;
    b{
        color:red;
    }
}
p{
    padding: 0.4em 0;
    text-indent: 2em;
}
</style>