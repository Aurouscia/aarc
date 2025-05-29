<script setup lang="ts">
import { useNameEditStore } from '@/models/stores/nameEditStore';
import { storeToRefs } from 'pinia';
import { useTwinTextarea } from './composables/useTwinTextarea';
import { enableContextMenu, disableContextMenu } from '@/utils/eventUtils/contextMenu';
import foldImg from '@/assets/ui/fold.svg'
import settingsImg from '@/assets/ui/settings.svg'
import ControlPointOptions from './sidebars/options/ControlPointOptions.vue';
import { watch } from 'vue';

const nameEditStore = useNameEditStore()
const { nameMain, nameSub, editing, edited, nameEditorDiv, controlPointOptionsPanel } = storeToRefs(nameEditStore)
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
    mainMaxRow: 10,
    subMaxRow: 10,
    apply: nameEditStore.applyName,
    endEditing: nameEditStore.endEditing
})
watch(editing, newVal=>{
    if(newVal){
        enableContextMenu()
    }else{
        disableContextMenu()
    }
})
</script>

<template>
    <div class="nameEditor bangPanel" :class="{retracted:!editing}" ref="nameEditorDiv">
        <textarea v-model="nameMain" ref="nameMainInput" :rows="nameMainRows" @input="inputHandler('main')"
            @focus="nameEditStore.nameInputFocusHandler" @keydown="keyHandler"
            spellcheck="false" placeholder="请输入站名"></textarea>
        <textarea v-model="nameSub" ref="nameSubInput" :rows="nameSubRows" @input="inputHandler('sub')"
            @focus="nameEditStore.nameInputFocusHandler" @keydown="keyHandler" class="secondary"
            spellcheck="false" placeholder="请输入外语站名/副站名"></textarea>
        <div @click="nameEditStore.controlPointOptionsPanelOpen" class="settingsBtn sqrBtn withShadow">
            <img :src="settingsImg"/>
        </div>
        <div @click="nameEditStore.endEditing()" class="retractBtn sqrBtn withShadow">
            <img :src="foldImg"/>
        </div>
    </div>
    <ControlPointOptions @changed="edited=true" ref="controlPointOptionsPanel"></ControlPointOptions>
</template>

<style scoped lang="scss">
</style>