<script setup lang="ts">
import { useNameEditStore } from '@/models/stores/nameEditStore';
import { storeToRefs } from 'pinia';
import { useTwinTextarea } from './composables/useTwinTextarea';
import foldImg from '@/assets/ui/fold.svg'

const nameEditStore = useNameEditStore()
const { nameMain, nameSub, editing, nameEditorDiv } = storeToRefs(nameEditStore)
const { 
    mainInput: nameMainInput,
    subInput: nameSubInput,
    mainRows: nameMainRows,
    subRows: nameSubRows,
    keyHandler,
    inputHandler,
} = useTwinTextarea({
    main: nameMain,
    sub: nameSub,
    mainMaxRow: 2,
    subMaxRow: 3,
    apply: nameEditStore.applyName,
    endEditing: nameEditStore.endEditing
})
</script>

<template>
    <div class="nameEditor bangPanel" :class="{retracted:!editing}" ref="nameEditorDiv">
        <textarea v-model="nameMain" ref="nameMainInput" :rows="nameMainRows" @input="inputHandler('main')"
            @focus="nameEditStore.nameInputFocusHandler" @keydown="keyHandler"
            spellcheck="false" placeholder="请输入站名"></textarea>
        <textarea v-model="nameSub" ref="nameSubInput" :rows="nameSubRows" @input="inputHandler('sub')"
            @focus="nameEditStore.nameInputFocusHandler" @keydown="keyHandler" class="subName"
            spellcheck="false" placeholder="请输入外语站名/副站名"></textarea>
        <div @click="nameEditStore.endEditing()" class="retractBtn sqrBtn withShadow">
            <img :src="foldImg"/>
        </div>
    </div>
</template>

<style scoped lang="scss">
textarea.subName{
    margin-top: 5px;
    font-size: 15px;
}
</style>