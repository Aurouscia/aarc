<script setup lang="ts">
import { useNameEditStore } from '@/models/stores/nameEditStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { storeToRefs } from 'pinia';
import { useTwinTextarea } from './composables/useTwinTextarea';
import { enableContextMenu, disableContextMenu } from '@/utils/eventUtils/contextMenu';
import foldImg from '@/assets/ui/fold.svg'
import settingsImg from '@/assets/ui/settings.svg'
import pinyinConvertImg from '@/assets/ui/pinyinConvert.svg'
import ControlPointOptions from './sidebars/options/ControlPointOptions.vue';
import { usePinyinConvert } from './composables/usePinyinConvert';
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useNameSearchStore } from '@/models/stores/nameSearchStore';
import { coordDist } from '@/utils/coordUtils/coordDist';
import { useEditorLocalConfigStore } from '@/app/localConfig/editorLocalConfig';
import { numberCmpEpsilon } from '@/utils/consts';

const saveStore = useSaveStore();
const nameEditStore = useNameEditStore()
const nameSearchStore = useNameSearchStore()
const { nameMain, nameSub, editing, edited, targetPtId } = storeToRefs(nameEditStore)
const { duplicateNameDistThrs } = storeToRefs(useEditorLocalConfigStore())
const { convertPinyin, pinyinOverriding } = usePinyinConvert(nameMain, nameSub, ()=>nameEditStore.applyName())
const mainInput = useTemplateRef('nameMainInput')
const subInput = useTemplateRef('nameSubInput')
const nameEditorDiv = useTemplateRef('nameEditorDiv')
const controlPointOptionsPanel = useTemplateRef('controlPointOptionsPanel')
const { 
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
    pinyinConvert: convertPinyin,
    mainInput,
    subInput,
})

async function convertPinyinCall(){
    await convertPinyin()
}

function clickDuplicateWarning(){
    nameSearchStore.toggleShow(nameMain.value)
}

function focusHandler(){
    enableContextMenu(10)
}
function blurHandler(){
    disableContextMenu()
}

onMounted(()=>{
    window.addEventListener('keydown', keyHandler)
    if(!nameEditorDiv.value)
        throw new Error('nameEditorDiv 获取失败')
    nameEditStore.init(nameEditorDiv.value, (pt)=>{
        controlPointOptionsPanel.value?.startEditing(pt)
    })
})
onUnmounted(()=>{
    window.removeEventListener('keydown', keyHandler)
})

// 拆分为两个computed，避免拖动车站时重新计算
const sameNameStas = computed(()=>{
    // 不使用nameMain.value而是现场差，避免输入时触发两次
    let name = saveStore.getPtById(targetPtId.value ?? -1)?.name // 速度极快
    if(!name || name.length > 30)
        return []
    let sameNameStas = saveStore.save?.points.filter(p => {
        return p.name == name && p.id != targetPtId.value
    })
    return sameNameStas ?? []
})
const sameNameAndFarEnough = computed(()=>{
    let targetPt = saveStore.getPtById(targetPtId.value ?? -1)
    if(!targetPt)
        return sameNameStas.value.length > 0
    let thrs = Number(duplicateNameDistThrs.value)
    if(isNaN(thrs))
        thrs = 0
    return !!sameNameStas.value.find(p => {
        let dist = coordDist(p.pos, targetPt.pos)
        let farEnough = dist > (thrs + numberCmpEpsilon)
        return farEnough
    })
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
        <div class="duplicateNameWarning sqrBtn withShadow" @click="clickDuplicateWarning"
        v-if="sameNameAndFarEnough" title="这个站名已经在地图内出现过">
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