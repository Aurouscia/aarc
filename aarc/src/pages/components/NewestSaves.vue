<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore';
import { onMounted, onUnmounted, ref } from 'vue';
import { useSavesRoutesJump } from '../saves/routes/routesJump';
import { SaveDto } from '@/app/com/apiGenerated';
import SaveAvatar from './SaveAvatar.vue';
import Loading from '@/components/common/Loading.vue';

const props = defineProps<{
    forAuditor?: boolean
}>()
const api = useApiStore()
const { someonesSavesRoute } = useSavesRoutesJump()
const list = ref<SaveDto[]>([])
async function load(){
    loaded.value = false
    let resp:SaveDto[]|undefined
    if(props.forAuditor)
        resp = await api.save.getNewestSavesAudit()
    else
        resp = await api.save.getNewestSaves()
    if(resp){
        list.value = resp
        loaded.value = true
    }
}

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
let loadTimer: ReturnType<typeof setInterval> | null = null

function lastActiveFromNow(unix?: number){
    if(!unix)
        return ''
    const diff = now.value - unix
    const oneDayMs = 24 * 60 * 60 * 1000
    const oneHourMs = 60 * 60 * 1000
    const oneMinMs = 60 * 1000
    const oneSec = 1000
    if(diff >= oneDayMs * 4)
        return ''
    if(diff > oneDayMs)
        return Math.floor(diff / oneDayMs) + '天前'
    if(diff > oneHourMs)
        return Math.floor(diff / oneHourMs) + '小时前'
    if(diff > oneMinMs)
        return Math.floor(diff / oneMinMs) + '分钟前'
    return Math.floor(diff / oneSec) + '秒前'
}

const loaded = ref(false)

onMounted(async()=>{
    await load()
    timer = setInterval(() => {
        now.value = Date.now()
    }, 1000)
    loadTimer = setInterval(() => {
        load()
    }, 10000)
})

onUnmounted(()=>{
    if(timer){
        clearInterval(timer)
        timer = null
    }
    if(loadTimer){
        clearInterval(loadTimer)
        loadTimer = null
    }
})
</script>

<template>
<div v-if="loaded" class="newestSaves">
    <div v-for="s in list" :key="s.id">
        <SaveAvatar :s="s" :size="120"></SaveAvatar>
        <div class="cvsName">{{ s.name }}</div>
        <div class="cvsData">{{ s.lineCount }}线 {{ s.staCount }}站</div>
        <RouterLink :to="someonesSavesRoute(s.ownerUserId||0)" class="cvsOwner">
            {{ s.ownerName }}
        </RouterLink>
        <div class="cvsData">{{ lastActiveFromNow(s.lastActiveUnix) }}</div>
    </div>
</div>
<Loading v-else></Loading>
</template>

<style scoped lang="scss">
.newestSaves{
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    max-width: 100%;
    overflow-x: auto;
    justify-content: flex-start;
    padding: 15px;
    gap: 15px;
    &>div{
        width: 120px;
        flex-shrink: 0;
        flex-grow: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        .cvsName, .cvsOwner, .cvsData{
            max-width: 90%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            user-select: none;
        }
        .cvsOwner, .cvsData{
            font-size: 0.8em;
            color: #666;
        }
        .cvsOwner{
            padding: 3px;
            border-radius: 5px;
            background-color: #666;
            color: white;
            min-width: 80px;
            text-align: center;
            font-weight: bold;
        }
    }
}
</style>