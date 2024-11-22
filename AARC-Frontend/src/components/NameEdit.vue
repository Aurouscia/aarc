<script setup lang="ts">
import { useNameEditStore } from '@/models/stores/nameEditStore';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const nameEditStore = useNameEditStore()
const { nameMain, nameSub, editing, nameEditorDiv } = storeToRefs(nameEditStore)
const nameMainRows = computed<number>(()=>{
    return countChar(nameMain.value, '\n')
})
const nameSubRows = computed<number>(()=>{
    return countChar(nameSub.value, '\n')
})
function countChar(str:string|undefined, char:string){
    let count = 1
    if(!str)
        return count
    for(let c of str){
        if(c===char){
            count++
        }
    }
    return count
}
function inputHandler(type:'main'|'sub'){
    if(type == 'main'){
        //主站名限制两行
        const n = nameMain.value
        if(n){
            const rowCount = nameMainRows.value
            if(rowCount > 2){
                const idx = n.lastIndexOf('\n')
                if(idx > 0){
                    nameMain.value = n.slice(0, idx) + n.slice(idx + 1);
                }
            }
        }
    }else{
        //副站名限制三行
        const n = nameSub.value
        if(n){
            const rowCount = nameSubRows.value
            if(rowCount > 3){
                const idx = n.lastIndexOf('\n')
                if(idx > 0){
                    nameSub.value = n.slice(0, idx) + n.slice(idx + 1);
                }
            }
        }
    }
    nameEditStore.applyName()
}
</script>

<template>
    <div class="nameEditor" :class="{hidden:!editing}" ref="nameEditorDiv">
        <textarea v-model="nameMain" :rows="nameMainRows" @input="inputHandler('main')"
            @focus="nameEditStore.nameInputFocusHandler" spellcheck="false"></textarea>
        <textarea v-model="nameSub" :rows="nameSubRows" @input="inputHandler('sub')"
            @focus="nameEditStore.nameInputFocusHandler" class="subName" spellcheck="false"></textarea>
    </div>
</template>

<style scoped lang="scss">
.nameEditor{
    position: fixed;
    padding: 10px;
    top: -10px;
    padding-top: 20px;
    left: 10px;
    right: 10px;
    max-width: 300px;
    margin: auto;
    border-radius: 10px;
    background-color: #ccc;
    box-shadow: 0px 0px 10px 0px;
    z-index: 10;
    transition: 0.2s;
    transition-timing-function: ease-out;
}
.nameEditor.hidden{
    top: -150px;
    transition-timing-function: ease-in;
}
textarea{
    resize: none;
    overflow: hidden;
    display: block;
    font-family: unset;
    font-size: 18px;
    border: none;
    width: 100%;
    background-color: white;
    padding: 3px;
    border-radius: 5px;
}
textarea.subName{
    margin-top: 5px;
    font-size: 15px;
}
</style>