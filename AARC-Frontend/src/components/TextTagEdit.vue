<script setup lang="ts">
import { useTextTagEditStore } from '@/models/stores/textTagEditStore';
import { storeToRefs } from 'pinia';
import { useTwinTextarea } from './composables/useTwinTextarea';
import { computed } from 'vue';
import TextOptions from './TextOptions.vue';
import { useEnvStore } from '@/models/stores/envStore';
import foldImg from '@/assets/ui/fold.svg'

const textTagEditStore = useTextTagEditStore()
const envStore = useEnvStore()
const { 
    textMain, textSub, editing, textEditorDiv, targetForType, options, edited
} = storeToRefs(textTagEditStore)
const inputPlaceholder = computed<string|undefined>(()=>{
    const t = targetForType.value
    if(t==='common')
        return "留空使用线路名"
    if(t==='terrain')
        return "留空使用地形名"
    return "请输入文本"
})
const { 
    mainRows, mainInput,
    subRows, subInput,
    keyHandler,
    inputHandler
} = useTwinTextarea({
    main: textMain,
    sub: textSub,
    mainMaxRow: 2,
    subMaxRow: 3,
    apply: textTagEditStore.applyText,
    endEditing: textTagEditStore.endEditing
})
</script>

<template>
    <div class="textTagEditor bangPanel" :class="{retracted:!editing}" ref="textEditorDiv">
        <div class="inputPart">
            <textarea v-model="textMain" ref="mainInput" :rows="mainRows" @input="inputHandler('main')" :placeholder="inputPlaceholder"
                @focus="textTagEditStore.textInputFocusHandler" @click="textTagEditStore.textInputClickHandler('main')"
                @keydown="keyHandler" spellcheck="false"></textarea>
            <textarea v-model="textSub" ref="subInput" :rows="subRows" @input="inputHandler('sub')" :placeholder="inputPlaceholder"
                @focus="textTagEditStore.textInputFocusHandler"  @click="textTagEditStore.textInputClickHandler('sub')"
                @keydown="keyHandler" class="subText" spellcheck="false"></textarea>
        </div>
        <div v-if="!targetForType" class="optionsPart">
            <TextOptions :target="options" @changed="edited=true"></TextOptions>
        </div>
        <div @click="envStore.duplicateTextTag();textTagEditStore.endEditing()" class="duplicateBtn sqrBtn withShadow">
            <div class="dupA"></div><div class="dupB"></div>
        </div>
        <div @click="textTagEditStore.endEditing()" class="retractBtn sqrBtn withShadow">
            <img :src="foldImg"/>
        </div>
    </div>
</template>

<style scoped lang="scss">
.textTagEditor{
    max-width: 615px;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 10px;
    .inputPart{
        width: 300px;
    }
}
.inputPart{
    flex-shrink: 3;
}
.optionsPart{
    flex-shrink: 2;
    background-color: white;
    border-radius: 5px;
    width: 300px;
}
textarea.subText{
    margin-top: 5px;
    font-size: 15px;
}
</style>