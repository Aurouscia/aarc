<script setup lang="ts">
import { useTextTagEditStore } from '@/models/stores/textTagEditStore';
import { storeToRefs } from 'pinia';
import { useTwinTextarea } from './composables/useTwinTextarea';
import { computed } from 'vue';
import TextOptions from './TextOptions.vue';

const textTagEditStore = useTextTagEditStore()
const { 
    textMain, textSub, editing, textEditorDiv, editingForType, options, edited
} = storeToRefs(textTagEditStore)
const inputPlaceholder = computed<string|undefined>(()=>{
    const t = editingForType.value
    if(t==='common')
        return "留空使用线路名"
    if(t==='terrain')
        return "留空使用地形名"
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
    <div class="textTagEditor" :class="{hidden:!editing}" ref="textEditorDiv">
        <div class="inputPart">
            <textarea v-model="textMain" ref="mainInput" :rows="mainRows" @input="inputHandler('main')" :placeholder="inputPlaceholder"
                @focus="textTagEditStore.textInputFocusHandler" @click="textTagEditStore.textInputClickHandler('main')"
                @keydown="keyHandler" spellcheck="false"></textarea>
            <textarea v-model="textSub" ref="subInput" :rows="subRows" @input="inputHandler('sub')" :placeholder="inputPlaceholder"
                @focus="textTagEditStore.textInputFocusHandler"  @click="textTagEditStore.textInputClickHandler('sub')"
                @keydown="keyHandler" class="subText" spellcheck="false"></textarea>
        </div>
        <div v-if="!editingForType" class="optionsPart">
            <TextOptions :target="options" @changed="edited=true"></TextOptions>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/styles/globalMixins';

.textTagEditor{
    @include globalMixins.bangPanel();
    max-width: 615px;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    .inputPart{
        width: 300px;
    }
}
.optionsPart{
    background-color: white;
    border-radius: 5px;
    width: 300px;
}
.textTagEditor.hidden{
    @include globalMixins.bangPanelHidden()
}
textarea{
    @include globalMixins.editorTextarea()
}
textarea.subText{
    margin-top: 5px;
    font-size: 15px;
}
</style>