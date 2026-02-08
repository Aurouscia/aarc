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

const recommendList = [
    '北京', '上海', '广州', '杭州', '成都', '武汉'
]
</script>

<template>
<div class="searchSave">
    <div class="inputContainer">
        <input v-model="search" placeholder="搜索存档名称"/>
        <button @click="jump">搜索</button>
    </div>
    <div class="recommend">
        <span>推荐搜索：</span>
        <span v-for="item in recommendList" :key="item" @click="search=item;jump()" class="recommend-item">
            {{ item }}
        </span>
    </div>
</div>
</template>

<style scoped lang="scss">
.searchSave{
    display: flex;
    flex-direction: column;
    align-items: center;
}
.recommend{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
    font-size: 14px;
    overflow-x: auto;
    span{
        color: #666;
        white-space: nowrap;
    }
    .recommend-item{
        color: cornflowerblue;
        cursor: pointer;
        margin: 0px 3px;
        &:hover{
            text-decoration: underline;
        }
    }
}
.inputContainer{
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