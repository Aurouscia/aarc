<script setup lang="ts">
import { UserDto } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import Prompt from '@/components/common/Prompt.vue';
import { ref } from 'vue';

const api = useApiStore()

const nameSearch = ref('')
const users = ref<UserDto[]>([])
async function load(){
    users.value = []
    if(!nameSearch.value) return
    const res = await api.user.quickSearch(nameSearch.value)
    if(res)
        users.value = res
}
let callLoadTimer = 0
function callLoad(){
    window.clearTimeout(callLoadTimer)
    callLoadTimer = window.setTimeout(load, 600)
}
async function selectUser(u:UserDto|undefined) {
    emit('select', u)
}
const emit = defineEmits<{
    (e:'select', u:UserDto|undefined): void
}>()
</script>

<template>
<Prompt @close="selectUser(undefined)">
    <div class="user-select-title">用户选择器</div>
    <div class="user-select">
        <input v-model="nameSearch" placeholder="搜索用户名" @input="callLoad"/>
        <div class="user-select-res">
            <div v-for="user in users" :key="user.id" @click="selectUser(user)">
                {{ user.name }}
            </div>
        </div>
    </div>
</Prompt>
</template>

<style scoped lang="scss">
.user-select-title{
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
}
.user-select{
    width: 240px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 10px;
    input{
        align-self: center;
    }
    .user-select-res{
        height: 300px;
        overflow-y: auto;
        &>div{
            padding: 5px;
            margin-bottom: 5px;
            border-radius: 5px;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            &:hover{
                background-color: #f0f0f0;
            }
        }
    }
}
</style>