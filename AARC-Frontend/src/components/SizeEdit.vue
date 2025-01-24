<script setup lang="ts">
import { computed, CSSProperties, nextTick, ref } from 'vue';
import SideBar from './common/SideBar.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { storeToRefs } from 'pinia';
import { useCvsFrameStore } from '@/models/stores/cvsFrameStore';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useBaseCvsDispatcher } from '@/models/cvs/dispatchers/baseCvsDispatcher';
import { minCvsSide } from '@/models/save';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useCvsBlocksControlStore } from '@/models/cvs/common/cvs';

const { pop } = useUniqueComponentsStore()
const saveStore = useSaveStore()
const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
const cvsFrameStore = useCvsFrameStore()
const cvsBlocksControlStore = useCvsBlocksControlStore()
const baseCvsDispatcher = useBaseCvsDispatcher()
const mainCvsDispatcher = useMainCvsDispatcher()
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
function changeIncre(idx:number, way:boolean){
    let inc = changeIncrement.value
    if(!way)
        inc = -inc
    pendingChanges.value[idx] += inc
    if(changeCompensate.value){
        const oppositeIdx = (idx+2) % 4
        pendingChanges.value[oppositeIdx] -= inc
    }
}
function changeIncrementIncre(way:boolean){
    const nowVal = changeIncrement.value
    let useBigIncInc = (way && nowVal>=200) || (!way && nowVal>200)
    let useGiantIncInc = false
    if(useBigIncInc){
        useGiantIncInc = (way && nowVal>=400) || (!way && nowVal>400)
    }
    let inc = useGiantIncInc ? 200 : (useBigIncInc ? 100 : 50)
    if(!way)
        inc = -inc
    changeIncrement.value += inc
    if(changeIncrement.value < 50)
        changeIncrement.value = 50
    else if(changeIncrement.value > 1000)
        changeIncrement.value = 1000
}

function abortChange(){
    pendingChanges.value = [0,0,0,0]
}
function applyChange(){
    const pc = pendingChanges.value
    const newW = cvsWidthPreview.value
    const newH = cvsHeightPreview.value
    if(newW > 20000 || newH > 20000){
        pop?.show('目前限制边长20000', 'failed')
        return
    }
    let moveDownward = pc[0]
    let moveRightward = pc[3]
    if(newH < minCvsSide)
        moveDownward = 0
    if(newW < minCvsSide)
        moveRightward = 0
    saveStore.moveEverything([moveRightward, moveDownward])
    saveStore.setCvsSize([newW, newH])
    cvsFrameStore.initContSizeStyle()
    nextTick(()=>{
        cvsBlocksControlStore.refreshBlocks()
        nextTick(()=>{
            baseCvsDispatcher.renderBaseCvs()
            mainCvsDispatcher.renderMainCvs({})
            pendingChanges.value = [0,0,0,0]
            sidebar.value?.fold()
            cvsFrameStore.updateScaleLock()
        })
    })
}

const sidebar = ref<InstanceType<typeof SideBar>>()
defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
</script>

<template>
<SideBar ref="sidebar" :shrink-way="'v-show'">
    <div class="sizeEdit">
        <div class="yControl">
            <div class="btnPair">
                <button @click="changeIncre(0, false)">-</button>
                <button @click="changeIncre(0, true)">+</button>
            </div>
            <div :style="changeStyleOf(0)">{{ changeTextOf(0) }}</div>
        </div>
        <div class="xControl">
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
        <div class="xControl">
            <div class="btnPair">
                <button @click="changeIncre(1, false)">-</button>
                <button @click="changeIncre(1, true)">+</button>
            </div>
            <div :style="changeStyleOf(1)">{{ changeTextOf(1) }}</div>
        </div>
        <div class="yControl">
            <div class="btnPair">
                <button @click="changeIncre(2, false)">-</button>
                <button @click="changeIncre(2, true)">+</button>
            </div>
            <div :style="changeStyleOf(2)">{{ changeTextOf(2) }}</div>
        </div>
    </div>
    <div class="incrementEdit">
        <div class="incTag">步长</div>
        <div class="incCtrl">
            <button @click="changeIncrementIncre(false)" class="off">-</button>
            <div class="incDisplay">{{ changeIncrement }}</div>
            <button @click="changeIncrementIncre(true)" class="off">+</button>
        </div>
    </div>
    <div class="incrementEdit">
        <div class="incTag">对侧补偿</div>
        <input type="checkbox" v-model="changeCompensate"/>
    </div>
    <div v-show="anyChangeExist" class="ops">
        <button class="cancel" @click="abortChange">放弃修改</button>
        <button class="ok" @click="applyChange">应用修改</button>
    </div>
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
    width: 250px;
    height: 250px;
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
    margin-top: 15px;
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
</style>