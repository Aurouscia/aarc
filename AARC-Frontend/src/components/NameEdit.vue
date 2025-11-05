<script setup lang="ts">
import { useNameEditStore } from '@/models/stores/nameEditStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useSaveStore } from '@/models/stores/saveStore';
import { storeToRefs } from 'pinia';
import { useTwinTextarea } from './composables/useTwinTextarea';
import { enableContextMenu, disableContextMenu } from '@/utils/eventUtils/contextMenu';
import foldImg from '@/assets/ui/fold.svg'
import settingsImg from '@/assets/ui/settings.svg'
import pinyinConvertImg from '@/assets/ui/pinyinConvert.svg'
import ControlPointOptions from './sidebars/options/ControlPointOptions.vue';
import { usePinyinConvert } from './composables/usePinyinConvert';
import { computed, onMounted, onUnmounted } from 'vue';


const { pop } = useUniqueComponentsStore()
const saveStore = useSaveStore();
const nameEditStore = useNameEditStore()
const { nameMain, nameSub, editing, edited, nameEditorDiv, controlPointOptionsPanel } = storeToRefs(nameEditStore)
const { convertPinyin, pinyinOverriding } = usePinyinConvert(nameMain, nameSub, ()=>nameEditStore.applyName())
const { 
    mainInput: nameMainInput,
    subInput: nameSubInput,
    mainRows: nameMainRows,
    subRows: nameSubRows,
    keyHandler,
    inputHandler,
} = useTwinTextarea({
    isEditing: editing,
    main: nameMain,
    sub: nameSub,
    mainMaxRow: 10,
    subMaxRow: 10,
    apply: nameEditStore.applyName,
    endEditing: nameEditStore.endEditing,
    pinyinConvert: convertPinyin
})

async function convertPinyinCall(){
    await convertPinyin()
}

function focusHandler(){
    enableContextMenu(10)
}
function blurHandler(){
    disableContextMenu()
}

onMounted(()=>{
    window.addEventListener('keydown', keyHandler)
})
onUnmounted(()=>{
    window.removeEventListener('keydown', keyHandler)
})

const hasSameNameInSave=computed(()=>{
    if(!nameMain.value){
        return false
    }
    let sameNameSta=saveStore.save?.points.filter(p=>p.name==nameMain.value)
    if (!sameNameSta){
        return false
    }
    return sameNameSta.length>1
})
</script>

<template>
    <div class="nameEditor bangPanel" :class="{retracted:!editing}" ref="nameEditorDiv">
        <textarea v-model="nameMain" ref="nameMainInput" :rows="nameMainRows" @input="inputHandler('main')"
            @focus="nameEditStore.nameInputFocusHandler();focusHandler()" @blur="blurHandler()"
            spellcheck="false" placeholder="请输入站名"></textarea>
        <textarea v-model="nameSub" ref="nameSubInput" :rows="nameSubRows" @input="inputHandler('sub')"
            @focus="nameEditStore.nameInputFocusHandler();focusHandler()" @blur="blurHandler()" class="secondary"
            spellcheck="false" placeholder="请输入外语站名/副站名"></textarea>
        <div class="repeatNameWarning sqrBtn withShadow" @click="pop?.show('已有其他同名车站', 'warning')"
        v-if="hasSameNameInSave" title="这个站名已经在地图内出现过">
            ⚠️
        </div>
        <div @click="convertPinyinCall" class="pinyinConvertBtn sqrBtn withShadow" :class="{pinyinOverriding}">
            <img v-if="!pinyinOverriding" :src="pinyinConvertImg"/>
            <div v-else>再次<br/>点击</div>
        </div>
        <div @click="nameEditStore.controlPointOptionsPanelOpen()" class="settingsBtn sqrBtn withShadow">
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