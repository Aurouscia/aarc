<script setup lang="ts">
import { onMounted, ref, computed, watch, useTemplateRef } from 'vue';
import { useApiStore } from '@/app/com/apiStore';
import { appVersionCheck } from '@/app/appVersionCheck';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useEnteredCanvasFromStore } from '@/app/globalStores/enteredCanvasFrom';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useRouter } from 'vue-router';
import { useSavesRoutesJump } from './routes/routesJump';
import { guideInfo } from '@/app/guideInfo';
import folderIcon from '@/assets/ui/folder.svg';
import SaveList from './components/SaveList.vue';
import { WithIntroShow } from '@/utils/type/WithIntroShow';
import { SaveDto } from '@/app/com/apiGenerated';

const saveList = ref<WithIntroShow<SaveDto>[]>()
const api = useApiStore();
const router = useRouter()
const { mySavesRoute, saveFoldersRoute } = useSavesRoutesJump()
const userInfoStore = useUserInfoStore()
const props = defineProps<{
    uid?: string
}>()
const uidNum = computed<number>(() => {
    const uid = parseInt(props.uid || '')
    if (isNaN(uid)) {
        return 0
    }
    if (uid && userInfoStore.userInfo.id === uid) {
        return 0
    }
    return uid
})
const isMine = computed<boolean>(() => uidNum.value === 0)
watch(uidNum, load)

const ownerName = ref<string>()
async function load() {
    setEnteredFrom()
    if (uidNum.value > 0) {
        const ownerInfo = await api.user.getInfo(uidNum.value)
        ownerName.value = ownerInfo?.name || '??'
    } else {
        ownerName.value = '我'
    }
    const list = await api.save.getMySaves(uidNum.value)
    saveList.value = (list || []).map(s => ({ ...s, introShow: false }))
}

async function fork(id?: number) {
    const resp = await api.save.fork(id)
    if (resp) {
        showPop('另存成功', 'success')
        router.push(mySavesRoute())
    }
}

const saveListRef = useTemplateRef('saveListRef')
const { setEnteredFrom } = useEnteredCanvasFromStore()
const uniqueComponents = useUniqueComponentsStore()
const showPop = uniqueComponents.showPop

onMounted(async () => {
    await load()
    await appVersionCheck()
})
</script>

<template>
    <h1 v-if="ownerName" class="h1WithBtns">
        <span v-if="isMine">我的存档</span>
        <span v-else><span class="ownerNameInH1">{{ ownerName }}</span>的存档</span>
        <div v-if="isMine">
            <RouterLink :to="saveFoldersRoute()">
                <img :src="folderIcon" class="folder-nav-icon" title="我的目录" />
            </RouterLink>
            <button @click="saveListRef?.startCreating">新建</button>
        </div>
    </h1>
    <SaveList ref="saveListRef" :saves="saveList" :is-mine="isMine" :show-fork="!isMine" @refresh="load"
        @fork="fork">
    </SaveList>
    <div v-if="guideInfo.findHelp" style="color: #666; font-size: 14px; text-align: center; margin-top: 10px;">
        {{ guideInfo.findHelp }}
    </div>
</template>

<style scoped lang="scss">
.ownerNameInH1 {
    letter-spacing: normal;
    margin-right: 0.1em;
}

.folder-nav-icon {
    width: 28px;
    height: 28px;
    color: #f0c040;
    cursor: pointer;
    margin-right: 8px;
    vertical-align: middle;

    &:hover {
        opacity: 0.8;
    }
}
</style>
