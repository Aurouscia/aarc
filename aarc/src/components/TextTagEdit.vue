<script setup lang="ts">
import { useTextTagEditStore } from '@/models/stores/textTagEditStore';
import { storeToRefs } from 'pinia';
import { useTwinTextarea } from './composables/useTwinTextarea';
import TextTagOptions from './sidebars/options/TextTagOptions.vue';
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useEnvStore } from '@/models/stores/envStore';
import foldImg from '@/assets/ui/fold.svg'
import settingsImg from '@/assets/ui/settings.svg'
import pinyinConvertImg from '@/assets/ui/pinyinConvert.svg'
import { disableContextMenu, enableContextMenu } from '@/utils/eventUtils/contextMenu';
import { usePinyinConvert } from './composables/usePinyinConvert';

const textTagEditStore = useTextTagEditStore()
const envStore = useEnvStore()
const { 
    textMain, textSub, editing, edited, targetForType
} = storeToRefs(textTagEditStore)
const inputPlaceholder = computed<string|undefined>(()=>{
    const t = targetForType.value
    if(t==='common')
        return "留空使用线路名"
    if(t==='terrain')
        return "留空使用地形名"
    return "请输入文本"
})

const { convertPinyin, pinyinOverriding } = usePinyinConvert(textMain, textSub, ()=>textTagEditStore.applyText())
async function convertPinyinCall(){
    await convertPinyin()
}

const mainInput = useTemplateRef('mainInput')
const subInput = useTemplateRef('subInput')
const textEditorDiv = useTemplateRef('textEditorDiv')
const textTagOptionsPanel = useTemplateRef('textTagOptionsPanel')
const { 
    mainRows,
    subRows,
    keyHandler,
    inputHandler
} = useTwinTextarea({
    isEditing: editing,
    main: textMain,
    sub: textSub,
    mainMaxRow: 10,
    subMaxRow: 10,
    apply: textTagEditStore.applyText,
    endEditing: textTagEditStore.endEditing,
    pinyinConvert: convertPinyin,
    mainInput,
    subInput,
})
function focusHandler(){
    enableContextMenu(10)
}
function blurHandler(){
    disableContextMenu()
}

onMounted(()=>{
    window.addEventListener('keydown', keyHandler)
    if(!textEditorDiv.value)
        throw new Error('textEditorDiv 获取失败')
    textTagEditStore.init(textEditorDiv.value, (t)=>{
        textTagOptionsPanel.value?.startEditing(t)
    })
})
onUnmounted(()=>{
    console.log('unmounted')
    window.removeEventListener('keydown', keyHandler)
})
</script>

<template>
    <div class="textTagEditor bangPanel" :class="{retracted:!editing}" ref="textEditorDiv">
        <div>
            <textarea v-model="textMain" ref="mainInput" :rows="mainRows" @input="inputHandler('main')" :placeholder="inputPlaceholder"
                @focus="focusHandler()" @blur="blurHandler()" spellcheck="false"></textarea>
            <textarea v-model="textSub" ref="subInput" :rows="subRows" @input="inputHandler('sub')" :placeholder="inputPlaceholder"
                @focus="focusHandler()" @blur="blurHandler()" class="secondary" spellcheck="false"></textarea>
        </div>
        <div @click="envStore.duplicateTextTag();textTagEditStore.endEditing()" class="duplicateBtn sqrBtn withShadow">
            <div class="dupA"></div><div class="dupB"></div>
        </div>
        <div @click="convertPinyinCall" class="pinyinConvertBtn sqrBtn withShadow" :class="{pinyinOverriding}">
            <img v-if="!pinyinOverriding" :src="pinyinConvertImg"/>
            <div v-else>再次<br/>点击</div>
        </div>
        <div @click="textTagEditStore.textTagOptionsPanelOpen" class="settingsBtn sqrBtn withShadow">
            <img :src="settingsImg"/>
        </div>
        <div @click="textTagEditStore.endEditing()" class="retractBtn sqrBtn withShadow">
            <img :src="foldImg"/>
        </div>
    </div>
    <TextTagOptions ref="textTagOptionsPanel" @changed="edited=true"></TextTagOptions>
</template>

<style scoped lang="scss">
</style>