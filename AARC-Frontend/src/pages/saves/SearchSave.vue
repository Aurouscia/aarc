<script setup lang="ts">
import { SaveDto } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { onMounted, ref } from 'vue';
import defaultMini from '@/assets/logo/aarc.svg'
import Loading from '@/components/common/Loading.vue';
import { WithIntroShow } from '@/utils/type/WithIntroShow';

const api = useApiStore()
const props = defineProps<{
    searchInit?: string,
}>()

const search = ref<string|undefined>(props.searchInit)
const orderBy = ref<"sta"|undefined>()
const pageIdx = ref(0)

const searchRes = ref<WithIntroShow<SaveDto>[]>()
const searchedUsing = ref<string>()
async function load() {
    if(!search.value){
        searchedUsing.value = search.value
        searchRes.value = []
        return
    }
    const res = await api.save.search(search.value, orderBy.value, pageIdx.value)
    if(res){
        searchRes.value = res
        searchedUsing.value = search.value
    }
}

onMounted(()=>{
    if(props.searchInit){
        load()
    }
})
</script>

<template>
<h1 class="h1WithBtns">
    <div>搜索存档</div>
    <div>
        <input v-model="search" class="saveSearchInput" placeholder="搜索存档名称" @blur="load"/>
        <select v-model="orderBy" @change="load">
            <option :value="undefined">最新更新</option>
            <option :value="'sta'">车站最多</option>
        </select>
    </div>
</h1>
<div style="overflow-x: auto;">
<table v-if="searchRes" class="fullWidth index"><tbody>
    <tr>
        <th style="width: 100px;"></th>
        <th style="min-width: 200px;">
            名称
            <span class="introNote">简介点击展开</span>
        </th>
        <th style="width: 130px;min-width: 130px">作者</th>
        <th style="width: 130px;min-width: 130px">上次更新</th>
    </tr>
    <tr v-for="s in searchRes">
        <td>
            <img :src="s.miniUrl || defaultMini" class="mini"/>
        </td>
        <td>
            {{ s.name }}
            <div v-if="s.intro" class="itemIntro" :class="{nowrapEllipsis:!s.introShow}" @click="s.introShow=!s.introShow">
                {{ s.intro }}
            </div>
            <div class="dataInfo">—{{ s.lineCount }}线 {{ s.staCount }}站—</div>
        </td>
        <td>
            <div class="ownerName">{{ s.ownerName }}</div>
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