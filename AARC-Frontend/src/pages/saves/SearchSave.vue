<script setup lang="ts">
import { SaveDto } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { onMounted, ref } from 'vue';
import defaultMini from '@/assets/defaultMini.svg';
import Loading from '@/components/common/Loading.vue';
import { WithIntroShow } from '@/utils/type/WithIntroShow';
import { useSavesRoutesJump } from './routes/routesJump';
import { useRouter } from 'vue-router';
import { useEditorsRoutesJump } from '../editors/routes/routesJump';
import { useEnteredCanvasFromStore } from '@/app/globalStores/enteredCanvasFrom';

const api = useApiStore()
const { someonesSavesRoute, searchSaveRoute } = useSavesRoutesJump()
const { editorRoute } = useEditorsRoutesJump()
const router = useRouter()
const searchInit = router.currentRoute.value.query["search"] as string|undefined
const orderbyInit = router.currentRoute.value.query["orderby"] as string|undefined

const search = ref<string|undefined>(searchInit)
const orderBy = ref<string|undefined>(orderbyInit)
const pageIdx = ref(0)

const searchRes = ref<WithIntroShow<SaveDto>[]>()
const searchedUsing = ref<string>()
const searchedUsingOrderBy = ref<string>()
async function load() {
    if(!search.value){
        searchedUsing.value = search.value
        searchedUsingOrderBy.value = orderBy.value
        searchRes.value = []
        return
    }
    if(search.value === searchedUsing.value
        && orderBy.value === searchedUsingOrderBy.value)
    {
        return
    }
    if(search.value.length > 10){
        search.value = search.value.slice(0, 10)
    }
    searchRes.value = undefined
    const res = await api.save.search(search.value, orderBy.value, pageIdx.value)
    if(res){
        searchRes.value = res
        searchedUsing.value = search.value
        searchedUsingOrderBy.value = orderBy.value
        router.replace(searchSaveRoute(search.value, orderBy.value))
    }
}

const { setEnteredFrom } = useEnteredCanvasFromStore()
onMounted(()=>{
    setEnteredFrom()
    if(search.value){
        load()
    }else{
        searchRes.value = []
    }
})
</script>

<template>
<h1 class="h1WithBtns">
    <div>搜索存档</div>
    <div class="searchControl">
        <div>
            <button v-show="search" class="lite" @click="search=undefined;load()">清空</button>
            <input v-model="search" class="saveSearchInput" placeholder="搜索存档名称" @blur="load"/>
        </div>
        <select v-model="orderBy" @change="load">
            <option :value="undefined">最新更新</option>
            <option :value="'sta'">车站最多</option>
        </select>
    </div>
</h1>
<div style="overflow-x: auto;">
<table v-if="searchRes" class="fullWidth index"><tbody>
    <tr>
        <th style="width: 100px;min-width: 100px">点击进入</th>
        <th style="min-width: 200px;">
            名称
            <span class="introNote">简介点击展开</span>
        </th>
        <th style="width: 130px;min-width: 130px">作者</th>
        <th style="width: 130px;min-width: 130px">上次更新</th>
    </tr>
    <tr v-for="s in searchRes">
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
            <div class="ownerName">
                <RouterLink :to="someonesSavesRoute(s.ownerUserId??0)">{{ s.ownerName }}</RouterLink>
            </div>
        </td>
        <td>
            <div class="lastActive">{{ s.lastActive }}</div>
        </td>
    </tr>
    <tr v-if="search != searchedUsing" class="noMatch">
        <td colspan="4">点击输入框外任意处搜索</td>
    </tr>
    <tr v-else-if="!search && searchRes.length===0" class="noMatch">
        <td colspan="4">请输入搜索关键词</td>
    </tr>
    <tr v-else-if="searchRes.length===0" class="noMatch">
        <td colspan="4">无匹配结果</td>
    </tr>
</tbody></table>
<Loading v-else></Loading>
</div>
</template>

<style scoped lang="scss">
@use '@/styles/itemIntro.scss';
@use '@/styles/saveList.scss';

.noMatch{
    color: #666; 
    font-size: 16px;
}
</style>