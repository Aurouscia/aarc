<script setup lang="ts">
import { useTextTagEditStore } from '@/models/stores/textTagEditStore';
import { storeToRefs } from 'pinia';
import { useTwinTextarea } from './composables/useTwinTextarea';

const textTagEditStore = useTextTagEditStore()
const { textMain, textSub, editing, textEditorDiv } = storeToRefs(textTagEditStore)
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
        <textarea v-model="textMain" ref="mainInput" :rows="mainRows" @input="inputHandler('main')"
            @focus="textTagEditStore.textInputFocusHandler" @keydown="keyHandler" spellcheck="false"></textarea>
        <textarea v-model="textSub" ref="subInput" :rows="subRows" @input="inputHandler('sub')"
            @focus="textTagEditStore.textInputFocusHandler" @keydown="keyHandler" class="subText" spellcheck="false"></textarea>
    </div>
</template>

<style scoped lang="scss">
@use '@/styles/globalMixins';

.textTagEditor{
    @include globalMixins.bangPanel()
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