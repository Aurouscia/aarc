<script setup lang="ts">
import { useTextTagEditStore } from '@/models/stores/textTagEditStore';
import { storeToRefs } from 'pinia';
import { useTwinTextarea } from './composables/useTwinTextarea';
import { computed } from 'vue';
import TextOptions from './TextOptions.vue';

const textTagEditStore = useTextTagEditStore()
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
        <div @click="textTagEditStore.endEditing()" class="retractBtn sqrBtn withShadow">×</div>
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