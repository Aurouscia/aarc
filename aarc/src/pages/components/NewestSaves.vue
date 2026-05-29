<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore';
import { onMounted, ref } from 'vue';
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

function lastActiveFromNow(unix?: number){
    if(!unix)
        return ''
    const now = Date.now()
    const diff = now - unix
    //如果超过三天，返回空字符串
    //如果超过24小时，返回x天
    //如果超过1小时，显示x小时
    //如果超过1分钟，显示x分钟
    //如果不足1分钟，显示x秒
    const oneDaySecs = 24 * 60 * 60 * 1000
    const oneHourSecs = 60 * 60 * 1000
    const oneMinSecs = 60 * 1000
    const oneSec = 1000
    if(diff >= oneDaySecs * 4)
        return '' 
    if(diff > oneDaySecs)
        return Math.floor(diff / oneDaySecs) + '天前' 
    if(diff > oneHourSecs)
        return Math.floor(diff / oneHourSecs) + '小时前'
    if(diff > oneMinSecs)
        return Math.floor(diff / oneMinSecs) + '分钟前'
    return Math.floor(diff / oneSec) + '秒前'
}

const loaded = ref(false)

onMounted(async()=>{
    await load()
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