<script setup lang="ts">
import { computed, CSSProperties, nextTick, ref, useTemplateRef, watch } from 'vue';
import SideBar from '../common/SideBar.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { storeToRefs } from 'pinia';
import { useCvsFrameStore } from '@/models/stores/cvsFrameStore';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useBaseCvsDispatcher } from '@/models/cvs/dispatchers/baseCvsDispatcher';
import { minCvsSide } from '@/models/save/valid/cvsSize';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useCvsBlocksControlStore } from '@/models/cvs/common/cvs';
import Notice from '../common/Notice.vue';
import { useStaNameMainRectStore } from '@/models/stores/saveDerived/staNameRectStore';

const { showPop } = useUniqueComponentsStore()
const saveStore = useSaveStore()
const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
const cvsFrameStore = useCvsFrameStore()
const cvsBlocksControlStore = useCvsBlocksControlStore()
const baseCvsDispatcher = useBaseCvsDispatcher()
const mainCvsDispatcher = useMainCvsDispatcher()
const staNameMainRectStore = useStaNameMainRectStore()
const pendingChanges = ref<[number, number, number, number]>([0,0,0,0]) //上，右，下，左
const changeIncrement = ref<number>(100)
const changeCompensate = ref<boolean>(false)
const cvsWidthPreview = computed(()=>{
    let w = cvsWidth.value
    w += pendingChanges.value[1]
    w += pendingChanges.value[3]
    return w
})
const cvsHeightPreview = computed(()=>{
    let w = cvsHeight.value
    w += pendingChanges.value[0]
    w += pendingChanges.value[2]
    return w
})
const tooBigWarnThrs = 20000
const tooBigRefuseThrs = 60000
const cvsPreviewTooBig = computed<boolean>(()=>{
    return cvsWidthPreview.value > tooBigWarnThrs || cvsHeightPreview.value > tooBigWarnThrs 
})
const pendingLeftOrUpCantDivideBy100 = computed<boolean>(()=>{
    return pendingChanges.value[0] % 100 !== 0 || pendingChanges.value[3] % 100 !== 0
})
const anyChangeExist = computed(()=>pendingChanges.value.some(x=>x!==0))
function changeStyleOf(idx:number):CSSProperties{
    const val = pendingChanges.value[idx]
    if(val>0)
        return {color:'green', fontWeight: 'bold'}
    else if(val<0)
        return {color:'plum', fontWeight: 'bold'}
    return {color:'gray', fontWeight:'normal'}
}
function changeTextOf(idx:number):string{
    const val = pendingChanges.value[idx]
    if(val>=0)
        return `+${val}`
    return val.toString()
}
function changeIncre(idx:0|1|2|3, way:boolean){
    ensurePendingChangesAllNumber()
    let inc = changeIncrement.value
    if(!way)
        inc = -inc
    pendingChanges.value[idx] += inc
    if(changeCompensate.value){
        const oppositeIdx = (idx+2) % 4
        pendingChanges.value[oppositeIdx] -= inc
    }
}
function ensurePendingChangesAllNumber(){
    for(let i = 0; i < 4; i++){
        let num = pendingChanges.value[i]
        if(typeof num !== 'number')
            num = parseFloat(num)
        if(isNaN(num))
            num = 0
        pendingChanges.value[i] = num
    }
}
watch(pendingChanges, ()=>{
    ensurePendingChangesAllNumber()
}, {deep:true})

const availableIncrements = [1, 10, 100, 400, 1000]
function changeIncrementIncre(way:boolean){
    const nowVal = changeIncrement.value
    if(way){
       const newVal = availableIncrements.find(x=>x>nowVal)
       if(newVal)
            changeIncrement.value = newVal 
    }
    else{
        const newValIdxP1 = availableIncrements.findIndex(x=>x>=nowVal)
        if(newValIdxP1>0)
            changeIncrement.value = availableIncrements[newValIdxP1-1]
    }
}

function abortChange(){
    pendingChanges.value = [0,0,0,0]
}
function applyChange(){
    const pc = pendingChanges.value
    const newW = cvsWidthPreview.value
    const newH = cvsHeightPreview.value
    if(newW > tooBigRefuseThrs || newH > tooBigRefuseThrs){
        showPop(`边长限制${tooBigRefuseThrs}`, 'failed')
        return
    }
    let moveDownward = pc[0]
    let moveRightward = pc[3]
    if(newH < minCvsSide)
        moveDownward = 0
    if(newW < minCvsSide)
        moveRightward = 0
    staNameMainRectStore.clearItems()
    saveStore.moveEverything([moveRightward, moveDownward])
    saveStore.setCvsSize([newW, newH])
    cvsFrameStore.initContSizeStyle()
    nextTick(()=>{
        cvsBlocksControlStore.refreshBlocks(false)
        nextTick(()=>{
            baseCvsDispatcher.renderBaseCvs()
            mainCvsDispatcher.renderMainCvs({})
            pendingChanges.value = [0,0,0,0]
            sidebar.value?.fold()
            cvsFrameStore.updateScaleLock()
        })
    })
}

const manualMode = ref(false)
const sidebar = useTemplateRef('sidebar')
defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
</script>

<template>
<SideBar ref="sidebar" :shrink-way="'v-show'">
    <div class="sizeEdit">
        <div class="yControl" v-if="manualMode">
            <input v-model.number.lazy="pendingChanges[0]" type="number" step="100"/>
        </div>
        <div class="yControl" v-else>
            <div class="btnPair">
                <button @click="changeIncre(0, false)">-</button>
                <button @click="changeIncre(0, true)">+</button>
            </div>
            <div :style="changeStyleOf(0)">{{ changeTextOf(0) }}</div>
        </div>
        <div class="xControl" v-if="manualMode">
            <input v-model.number.lazy="pendingChanges[3]" type="number" step="100"/>
        </div>
        <div class="xControl" v-else>
            <div class="btnPair">
                <button @click="changeIncre(3, false)">-</button>
                <button @click="changeIncre(3, true)">+</button>
            </div>
            <div :style="changeStyleOf(3)">{{ changeTextOf(3) }}</div>
        </div>
        <div class="sizeDisplay">
            <div>
                <div class="wh">{{ `${cvsWidth}×${cvsHeight}` }}</div>
            </div>
            <div v-show="anyChangeExist" class="sizePreview">
                <div class="wh">{{ `${cvsWidthPreview}×${cvsHeightPreview}` }}</div>
            </div>
        </div>
        <div class="xControl" v-if="manualMode">
            <input v-model.number.lazy="pendingChanges[1]" type="number" step="100"/>
        </div>
        <div class="xControl" v-else>
            <div class="btnPair">
                <button @click="changeIncre(1, false)">-</button>
                <button @click="changeIncre(1, true)">+</button>
            </div>
            <div :style="changeStyleOf(1)">{{ changeTextOf(1) }}</div>
        </div>
        <div class="yControl" v-if="manualMode">
            <input v-model.number.lazy="pendingChanges[2]" type="number" step="100"/>
        </div>
        <div class="yControl" v-else>
            <div class="btnPair">
                <button @click="changeIncre(2, false)">-</button>
                <button @click="changeIncre(2, true)">+</button>
            </div>
            <div :style="changeStyleOf(2)">{{ changeTextOf(2) }}</div>
        </div>
    </div>
    <div class="ops">
        <button v-if="!manualMode" @click="manualMode=true" class="minor">手动输入增量</button>
        <button v-else @click="manualMode=false" class="minor">按钮调整增量</button>
    </div>
    <div v-if="!manualMode" class="incrementEdit">
        <div class="incTag">步长</div>
        <div class="incCtrl">
            <button @click="changeIncrementIncre(false)" class="off">-</button>
            <div class="incDisplay">{{ changeIncrement }}</div>
            <button @click="changeIncrementIncre(true)" class="off">+</button>
        </div>
    </div>
    <div v-if="!manualMode" class="incrementEdit">
        <div class="incTag">对侧补偿</div>
        <input type="checkbox" v-model="changeCompensate"/>
    </div>
    <div v-show="anyChangeExist" class="ops">
        <button class="cancel" @click="abortChange">放弃修改</button>
        <button class="ok" @click="applyChange">应用修改</button>
    </div>
    <Notice v-if="pendingLeftOrUpCantDivideBy100" :type="'warn'">
        左侧/上方调整量应为100的倍数<br/>否则站点将脱离网格
    </Notice>
    <Notice v-if="cvsPreviewTooBig" :type="'info'">
        过大的画布会导致<br/>导出的图片难以分享
    </Notice>
</SideBar>
</template>

<style scoped lang="scss">
@mixin plusMinusBtn {
    width: 22px;
    height: 22px;
    line-height: 22px;
    padding: 0px;
    margin: 0px;
}
.btnPair{
    display: flex;
    gap: 3px;
    button{
        @include plusMinusBtn()
    }
}
.sizeEdit{
    width: 270px;
    height: 270px;
    padding: 5px;
    margin: auto;
    background-color: #ccc;
    border-radius: 10px;
    display: grid;
    grid-template-rows: 1fr 2fr 1fr;
    grid-template-columns: 2fr 3fr 2fr;
    row-gap: 5px;
    column-gap: 5px;
    &>div{
        background-color: white;
        border-radius: 5px;
    }
}
.xControl, .yControl{
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    align-items: center;
}
.yControl{
    grid-column: 1 / 4;
}
.sizeDisplay, .sizeDisplay>div{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.sizePreview{
    background-color: #666;
    color:white;
    padding: 3px;
    border-radius: 5px;
}
.sizeDisplay{
    gap: 10px;
    color: #999;
    .wh{
        font-size: 12px;
    }
    .mem{
        font-weight: bold;
    }
}

.incrementEdit{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin: auto;
    margin-top: 10px;
    width: 250px;
    padding: 5px;
    background-color: #ccc;
    border-radius: 10px;
    color: white;
    button{
        @include plusMinusBtn()
    }
    &>*{
        flex-grow: 1;
    }
    .incTag{
        flex-basis: 100px;
        flex-grow: 0;
        text-align: center;
    }
    .incCtrl{
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: white;
        padding: 5px;
        color:#999;
        border-radius: 5px;
        .incDisplay{
            width: 80px;
            text-align: center;
            flex-grow: 1;
        }
    }
}

.ops{
    margin: 15px 0px 15px 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    button{
        width: 150px;
    }
}

.explain{
    width: 250px;
    margin: auto;
    margin-top: 10px;
    border-radius: 10px;
    background-color: #ccc;
    color: white;
    font-size: 14px;
    padding: 5px;
    a{
        text-decoration: underline;
        color:white;
    }
}

input[type=number]{
    width: 70px;
}
</style>