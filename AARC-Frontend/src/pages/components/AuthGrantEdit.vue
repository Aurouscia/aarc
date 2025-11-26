<script setup lang="ts">
import { AuthGrant, AuthGrantOn, AuthGrantTo, UserDtoSimple } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { useNameMapStore } from '@/app/globalStores/nameMap';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { computed, onMounted, ref, watch } from 'vue';
import UserSelect from './UserSelect.vue';

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
const { pop } = useUniqueComponentsStore()
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
    pop?.show('已调整顺序','success')
}
async function del(ag:AuthGrant){
    if(!window.confirm('确认删除？'))
        return
    const success = await apiStore.authGrant.remove(ag)
    if(success){
        await load()
        pop?.show('删除成功', 'success')
    }
}

const wantAdd = ref(false)
const newAg = ref<AuthGrant>({
    flag: true,
    to: AuthGrantTo.All,
    on: props.on,
    onId: props.onId,
    type: props.type,
})
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
async function add(){
    if(props.onId == 0){
        newAg.value.userId = userInfoStore.userInfo.id
    }
    const success = await apiStore.authGrant.create(newAg.value)
    if(success){
        await load()
        pop?.show('新增成功','success')
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

onMounted(async() => {
    await load()
})
</script>

<template>
<table class="fullWidth"><tbody>
    <tr v-for="ag,idx in listDisplay">
        <td :style="{color: ag.flagColor}">{{ ag.flagText }}</td>
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
                <option value="true">允许</option>
                <option value="false">拒绝</option>
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
        <td>
            <button class="lite" @click="add">新增</button>
        </td>
    </tr>
    <tr>
        <td colspan="3" v-if="!wantAdd">
            <button class="lite confirm" @click="wantAdd=true">新增授权设置</button>
        </td>
        <td colspan="3" v-else>
            <div class="smallNote">下方的会覆盖上方的</div>
        </td>
    </tr>
</tbody></table>
</template>

<style scoped lang="scss">
.ag-ops{
    text-align: right;
    width: 65px;
    button{
        margin: 0px 4px;
    }
}
.ag-to-name{
    font-size: 14px;
    max-width: 98px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #666;
}
</style>