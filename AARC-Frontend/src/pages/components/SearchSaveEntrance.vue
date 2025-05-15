<script lang="ts" setup>
import { ref } from 'vue';
import { useSavesRoutesJump } from '../saves/routes/routesJump';
import { useRouter } from 'vue-router';

const router = useRouter()
const { searchSaveRoute } = useSavesRoutesJump()
const search = ref('')
function jump(){
    if(!search.value) return
    router.push(searchSaveRoute(search.value))
}
</script>

<template>
<div class="searchSave">
    <input v-model="search" placeholder="搜索存档名称"/>
    <button @click="jump">搜索</button>
</div>
</template>

<style scoped lang="scss">
.searchSave{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
    input{
        width: 200px;
        border: 2px solid cornflowerblue;
        padding: 3px;
    }
    button{
        padding: 5px 15px;
    }
    input, button{
        margin: 0px;
        border-radius: 5px;
        font-size: 18px;
    }
}
</style>