<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    release: ()=>void,
    save: ()=>Promise<void>
}>();
const noSave = ref<boolean>(false);
function ok(){
    if(noSave.value){
        props.release();
    }
    emits('ok')
}
async function clickSave(){
    await props.save()
    emits('ok')
}
const emits = defineEmits<{
    (e:'ok'):void
}>()
</script>

<template>
    <div class="unsavedWarning fixFill">
        <div class="background fixFill"></div>
        <div class="panel">
            <h2>警告</h2>
            <div>
                有未保存的更改，离开前应先保存
            </div>
            <div>
                <button @click="clickSave">点击保存</button>
            </div>
            <div class="noSave">
                <input v-model="noSave" type="checkbox"> 我要不保存直接离开
            </div>
            <div>
                <button :class="noSave?'danger':'ok'" @click="ok">OK</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.unsavedWarning{
    z-index: 20000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.background{
    background-color: black;
    opacity: 0.2;
}
input{
    width: 25px;
    height: 25px;
}
.panel{
    border-radius: 10px;
    box-shadow: 0 0 10px 0 black;
    height: 200px;
    width: 300px;
    background-color: white;
    z-index: 20001;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    padding: 10px;
}
.noSave{
    display: flex;
    align-items: center;
    margin-top: 20px;
}
.fixFill{
  position: fixed;
  inset: 0px;
}
</style>