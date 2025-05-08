<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore';
import { onMounted, ref } from 'vue';
import defaultMini from '@/assets/logo/aarc.svg'
import { useEditorsRoutesJump } from '../editors/routes/routesJump';
import { useSavesRoutesJump } from '../saves/routes/routesJump';
import { SaveDto } from '@/app/com/apiGenerated';

const api = useApiStore()
const { editorRoute } = useEditorsRoutesJump()
const { someonesSavesRoute } = useSavesRoutesJump()
const list = ref<SaveDto[]>([])
async function load(){
    const resp = await api.save.getNewestSaves()
    if(resp){
        list.value = resp
    }
}
onMounted(async()=>{
    await load()
})
</script>

<template>
<div class="newestSaves">
    <div v-for="s in list" :key="s.id">
        <RouterLink :to="editorRoute(s.id??0)">
            <img :src="s.miniUrl || defaultMini"/>
        </RouterLink>
        <div class="cvsName">{{ s.name }}</div>
        <div class="cvsData">{{ s.lineCount }}线 {{ s.staCount }}站</div>
        <RouterLink :to="someonesSavesRoute(s.ownerUserId||0)" class="cvsOwner">
            {{ s.ownerName }}
        </RouterLink>
    </div>
</div>
</template>

<style scoped lang="scss">
.newestSaves{
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    max-width: 100%;
    overflow-x: auto;
    justify-content: space-around;
    padding: 15px;
    gap: 15px;
    $blockWidthMobile: 128px;
    $blockWidthPC: 256px;
    &>div{
        width: $blockWidthMobile;
        flex-shrink: 0;
        flex-grow: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        & img{
            width: $blockWidthMobile;
            height: $blockWidthMobile;
            border-radius: 15px;
            object-fit: contain;
            box-shadow: 0px 0px 0px 0px black;
            &:hover{
                transform: scale(1.03);
                box-shadow: 0px 0px 10px 0px black;
            }
        }
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
        @media screen and (min-width: 1000px) {
            width: $blockWidthPC;
            & img{
                width: $blockWidthPC;
                height: $blockWidthPC;
            }
        }
    }
}
</style>