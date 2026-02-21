<script setup lang="ts">
import { computed, CSSProperties, nextTick, ref, useTemplateRef, watch } from 'vue';
import SideBar from '../common/SideBar.vue';
import Prompt from '../common/Prompt.vue';
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
import ConfigSection from './configs/shared/ConfigSection.vue';

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
const tooBigRefuseThrs = 100000
const cvsPreviewTooBig = computed<boolean>(()=>{
    return cvsWidthPreview.value > tooBigWarnThrs || cvsHeightPreview.value > tooBigWarnThrs 
})
const pendingLeftOrUpCantDivideBy100 = computed<boolean>(()=>{
    return pendingChanges.value[0] % 100 !== 0 || pendingChanges.value[3] % 100 !== 0
})
const anyChangeExist = computed(()=>pendingChanges.value.some(x=>x!==0))
const everythingWillGoOut = computed(()=>{
    const w = cvsWidth.value
    const h = cvsHeight.value
    const [up, right, down, left] = pendingChanges.value
    return -up >= h || -right >= w || -down >= h || -left >= w
}) 
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
        showPop(`边长最大${tooBigRefuseThrs}`, 'failed')
        return
    }
    if(newW < minCvsSide || newH < minCvsSide){
        showPop(`边长最小${minCvsSide}`, 'failed')
        return
    }
    if(everythingWillGoOut.value){
        showPop('所有内容都将超出画布\n不允许这样更改', 'failed')
        return
    }
    let moveDownward = pc[0]
    let moveRightward = pc[3]
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

// -------- 图幅适配 --------
const fitPadRatio = ref<number>(0.02)

function fitCanvas() {
    if (!saveStore.save) return
    const xs: number[] = []
    const ys: number[] = []
    for (const pt of saveStore.save.points) {
        xs.push(pt.pos[0])
        ys.push(pt.pos[1])
    }
    for (const tag of saveStore.save.textTags) {
        xs.push(tag.pos[0])
        ys.push(tag.pos[1])
    }
    if (xs.length === 0) {
        showPop('画布上没有任何元素', 'failed')
        return
    }
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const spanX = maxX - minX
    const spanY = maxY - minY
    const padX = Math.round(spanX * fitPadRatio.value)
    const padY = Math.round(spanY * fitPadRatio.value)

    const targetLeft   = Math.round(minX - padX)
    const targetTop    = Math.round(minY - padY)
    const targetRight  = Math.round(maxX + padX)
    const targetBottom = Math.round(maxY + padY)

    pendingChanges.value = [
        -targetTop,
        targetRight - cvsWidth.value,
        targetBottom - cvsHeight.value,
        -targetLeft,
    ]
}

const manualMode = ref(false)
const sidebar = useTemplateRef('sidebar')
defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})

// -------- 坐标乘除 --------
const scaleRatio = ref<number>(2)
const scaleOp = ref<'multiply' | 'divide'>('multiply')

const scaleConfirming = ref<boolean>(false)

function scaleRatioInvalid(): boolean {
    const v = scaleRatio.value
    if (!v || isNaN(v) || v <= 0) return true
    return false
}

function requestScaleConfirm() {
    if (scaleRatioInvalid()) return
    scaleConfirming.value = true
}

function cancelScaleConfirm() {
    scaleConfirming.value = false
}

function executeScale() {
    if (!saveStore.save) return
    const ratio = scaleRatio.value
    const isDivide = scaleOp.value === 'divide'
    const factor = isDivide ? 1 / ratio : ratio

    for (const pt of saveStore.save.points) {
        pt.pos[0] = Math.round(pt.pos[0] * factor)
        pt.pos[1] = Math.round(pt.pos[1] * factor)
        if (pt.nameP) {
            pt.nameP[0] = Math.round(pt.nameP[0] * factor)
            pt.nameP[1] = Math.round(pt.nameP[1] * factor)
        }
    }
    for (const tag of saveStore.save.textTags) {
        tag.pos[0] = Math.round(tag.pos[0] * factor)
        tag.pos[1] = Math.round(tag.pos[1] * factor)
    }
    const newW = Math.round(saveStore.save.cvsSize[0] * factor)
    const newH = Math.round(saveStore.save.cvsSize[1] * factor)
    saveStore.setCvsSize([newW, newH])

    staNameMainRectStore.clearItems()
    cvsFrameStore.initContSizeStyle()
    nextTick(() => {
        cvsBlocksControlStore.refreshBlocks(false)
        nextTick(() => {
            baseCvsDispatcher.renderBaseCvs()
            mainCvsDispatcher.renderMainCvs({})
            cvsFrameStore.updateScaleLock()
        })
    })

    const opText = isDivide ? `÷${ratio}` : `×${ratio}`
    showPop(`坐标${opText} 操作成功`, 'success')
    scaleConfirming.value = false
}
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
        <button v-if="manualMode" @click="manualMode=false" class="minor">手动输入增量模式</button>
        <button v-else @click="manualMode=true" class="minor">按钮调整增量模式</button>
    </div>
    <div v-if="!manualMode" class="incrementEdit">
        <div class="incTag">按钮步长</div>
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
    <Notice v-if="everythingWillGoOut" :type="'danger'">
        这样调整后<br/>所有内容都会被移出画布范围
    </Notice>

    <ConfigSection :title="'图幅适配'">
        <div class="fitPad">
            <div class="fitPadRow">
                <span>边距比例</span>
                <input v-model.number="fitPadRatio" type="number" min="0" step="0.01" class="fitPadInput"/>
            </div>
            <button @click="fitCanvas">执行图幅适配</button>
        </div>
    </ConfigSection>

    <!-- 坐标乘除 -->
    <ConfigSection :title="'整体内容缩放'">
    <div class="scaleSection">
        <div class="scaleRow">
            <div class="scaleOpBtns">
                <button
                    :class="['scaleOpBtn', scaleOp === 'multiply' ? 'active' : 'minor']"
                    @click="scaleOp = 'multiply'"
                >乘法 ×</button>
                <button
                    :class="['scaleOpBtn', scaleOp === 'divide' ? 'active' : 'minor']"
                    @click="scaleOp = 'divide'"
                >除法 ÷</button>
            </div>
            <input
                v-model.number="scaleRatio"
                type="number"
                min="0.1"
                max="10.0"
                step="0.5"
                class="scaleInput"
                placeholder="倍率"
            />
        </div>
        <div class="scalePreview" v-if="!scaleRatioInvalid()">
            <span class="gray">画布将变为 </span>
            <span class="bold">
                {{
                    scaleOp === 'multiply'
                        ? `${Math.round(cvsWidth * scaleRatio)}×${Math.round(cvsHeight * scaleRatio)}`
                        : `${Math.round(cvsWidth / scaleRatio)}×${Math.round(cvsHeight / scaleRatio)}`
                }}
            </span>
        </div>
        <button
            @click="requestScaleConfirm"
            :disabled="scaleRatioInvalid()"
            class="scaleExecBtn"
        >执行坐标{{ scaleOp === 'multiply' ? '乘法' : '除法' }}</button>
    </div>

    <!-- 确认弹窗 -->
    <Prompt v-if="scaleConfirming" :bg-click-close="true" @close="cancelScaleConfirm">
        <div class="promptScale">
            <div class="promptScaleTitle">警告</div>
            <div class="promptScaleMsg">
                坐标乘除会破坏现有车站团的连接关系，需要重新手动拼合！你真的要执行此操作吗？
            </div>
            <div class="promptScaleBtns">
                <button class="minor" @click="cancelScaleConfirm">取消</button>
                <button class="danger" @click="executeScale">确认</button>
            </div>
        </div>
    </Prompt>
    </ConfigSection>
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
.sizeEdit {
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
    margin: 10px 0px 10px;
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

// -------- 图幅适配 --------
.fitPad{
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 4px;
    gap: 4px;
    .fitPadRow {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .fitPadInput {
        width: 60px;
    }
}

// -------- 坐标乘除 --------
.scaleSection {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 4px 12px;
}

.scaleRow {
    display: flex;
    align-items: center;
    gap: 10px;
}

.scaleOpBtns {
    display: flex;
    gap: 4px;
}

.scaleOpBtn {
    padding: 4px 10px;
    font-size: 13px;
    &.active {
        border: #555 2px solid;
        background-color: #555;
        color: white;
    }
}

.scaleInput {
    width: 72px;
    padding: 5px 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    &:focus {
        outline: none;
        border-color: #888;
    }
}

.scalePreview {
    font-size: 12px;
    .gray { color: #aaa; }
    .bold { font-weight: bold; color: #555; }
}

.scaleExecBtn {
    width: 150px;
    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
}

.promptScale {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    .promptScaleTitle {
        font-size: 18px;
        font-weight: bold;
        color: #c0392b;
    }
    .promptScaleMsg {
        text-align: center;
        font-size: 14px;
        color: #333;
        line-height: 1.6;
        max-width: 240px;
    }
    .promptScaleBtns {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
    }
}
</style>