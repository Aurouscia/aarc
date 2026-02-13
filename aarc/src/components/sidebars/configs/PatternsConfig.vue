<script setup lang="ts">
import { Pattern } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { useEnvStore } from '@/models/stores/envStore';
import { usePatternStore } from '@/models/stores/patternStore';
import { storeToRefs } from 'pinia';
import { CSSProperties, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import ConfigSection from '../configs/shared/ConfigSection.vue';
import { debounce } from '@/utils/lang/debounce';
import foldIcon from '@/assets/ui/fold.svg';
import { moveUpInArray } from '@/utils/lang/moveUpInArray';
import { AuColorPicker } from '@aurouscia/au-color-picker';

const saveStore = useSaveStore()
const { save } = storeToRefs(saveStore)
const envStore = useEnvStore()
const patternStore = usePatternStore()
const showDetail = ref<Record<number, boolean|undefined>>({})
const colorPicker = useTemplateRef('colorPicker')
// 记录每个图案是否保持宽高一致
const keepRatio = ref<Record<number, boolean>>({})

// 初始化 keepRatio 状态
function initKeepRatio(patterns?: Pattern[]){
    if(!patterns) return
    for(const p of patterns){
        if(keepRatio.value[p.id] === undefined){
            keepRatio.value[p.id] = p.width === p.height
        }
    }
}

// 处理宽度变化，如果保持比例则同步高度
function onWidthChange(pattern: Pattern){
    if(keepRatio.value[pattern.id]){
        pattern.height = pattern.width
    }
}

// 处理保持比例复选框变化
function onKeepRatioChange(pattern: Pattern, checked: boolean){
    keepRatio.value[pattern.id] = checked
    if(checked){
        pattern.height = pattern.width
    }
}

function clickContainer(){
    //点击"其他地方"关闭颜色选择器
    colorPicker.value?.forEach(cp=>cp?.closePanel())
}

function delPattern(pattern: Pattern){
    if(window.confirm(`确认删除纹理 ${pattern.name || ''}`)){
        const idx = save.value?.patterns?.findIndex(x=>x.id === pattern.id)
        if(idx!==undefined && idx>=0){
            save.value?.patterns?.splice(idx, 1)
        }
    }
}

function addPattern(){
    const newId = saveStore.getNewId()
    const newPattern:Pattern = {
        id: newId,
        name: '',
        width: 10,
        height: 10,
        grid: {
            width: 1,
            color: '#000000',
            opacity: 1,
            rise45: true,
            fall45: true
        }
    }
    // 新创建的图案默认保持宽高一致
    keepRatio.value[newId] = true
    save.value?.patterns?.push(newPattern)
    nextTick(()=>renderPreviewCvsOf(newPattern))
}

function cvsEleId(patternId: number){
    return `patternPreviewCvs_${patternId}`
}

const cvsWidth = 400
const cvsHeight = 200
const cvsStyle: CSSProperties = {
    width: '200px',
    height: '100px'
}

function renderPreviewCvs(){
    if(!save.value?.patterns)
        return
    for(const p of save.value?.patterns){
        renderPreviewCvsOf(p)
    }
}

function renderPreviewCvsOf(pattern: Pattern){
    const cvs = document.getElementById(cvsEleId(pattern.id)) as HTMLCanvasElement|null
    const ctx = cvs?.getContext('2d')
    if(!cvs || !ctx)
        return
    
    // 清空画布
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, cvsWidth, cvsHeight)

    const xRatio = cvsWidth / pattern.width
    const yRatio = cvsHeight / pattern.height
    const ratio = Math.min(xRatio, yRatio)
    const renderWidth = xRatio * pattern.width
    const renderHeight = xRatio * pattern.height
    
    const rendered = patternStore.getRendered(pattern.id, ratio, [0, 0], 'cornflowerblue', 1)
    if(!rendered)
        return
    ctx.drawImage(rendered, 0, 0, renderWidth, renderHeight)
}

const styleNameMaxLength = 8
function checkPatternName(p: Pattern){
    if(p.name && p.name.length > styleNameMaxLength){
        p.name = p.name.substring(0, styleNameMaxLength)
    }
}

function rerender(){
    envStore.rerender([], [])
    renderPreviewCvs()
}
const debouncedRerender = debounce(rerender, 600)
watch(()=>save.value?.patterns, ()=>{
    debouncedRerender()
}, {deep: true})

// 监听 patterns 变化，初始化新图案的 keepRatio
watch(()=>save.value?.patterns, (newPatterns)=>{
    initKeepRatio(newPatterns)
}, {deep: false})

onMounted(()=>{
    initKeepRatio(save.value?.patterns)
    renderPreviewCvs()
})
</script>

<template>
<ConfigSection :title="'纹理（新）'" @show="()=>$nextTick(renderPreviewCvs)">
<div class="patterns" @click="clickContainer">
    <div class="smallNote" style="text-align: center;">
        纹理目前可用在“线路风格”的层级中<br/>
        形成带网格花纹的线路
    </div>
    <div v-for="p,pIdx in save?.patterns" :key="p.id" :class="{showDetail:showDetail[p.id]}">
        <div class="preview" @click="showDetail[p.id] = !showDetail[p.id]">
            <canvas :width="cvsWidth" :height="cvsHeight" :style="cvsStyle" :id="cvsEleId(p.id)"></canvas>
            <div class="foldBtn">
                <img :src="foldIcon"/>
            </div>
        </div>
        <div v-if="showDetail[p.id]" class="detail">
            <div class="name">
                <h3>纹理名</h3><input v-model="p.name" placeholder="纹理名称(必填)" @blur="checkPatternName(p)"/>
            </div>
            <div class="dimensions">
                <div>
                    <b>宽度</b>
                    <div class="numberConfig">
                        <div class="leftPart">
                            <input type="range" v-model="p.width" :min="5" :max="50" :step="1" @input="onWidthChange(p)"/>
                        </div>
                        <div class="numberView">{{ p.width }}</div>
                    </div>
                </div>
                <div>
                    <b>高度</b>
                    <div class="numberConfig">
                        <div class="leftPart">
                            <input type="range" v-model="p.height" :min="5" :max="50" :step="1" :disabled="keepRatio[p.id]"/>
                        </div>
                        <div class="numberView">{{ p.height }}</div>
                    </div>
                </div>
                <div>
                    <b>保持一致</b>
                    <div class="numberConfig">
                        <input type="checkbox" :checked="keepRatio[p.id]" @change="e => onKeepRatioChange(p, (e.target as HTMLInputElement).checked)"/>
                    </div>
                </div>
            </div>
            <div class="gridConfig" v-if="p.grid">
                <div class="gridTitle">网格配置</div>
                <div class="gridSection">
                    <div>
                        <b>线宽</b>
                        <div class="numberConfig">
                            <div class="leftPart">
                                <input type="range" v-model="p.grid.width" :min="0.1" :max="5" :step="0.1"/>
                            </div>
                            <div class="numberView">{{ p.grid.width }}</div>
                        </div>
                    </div>
                    <template v-if="1+1==3">
                        <!--暂时隐藏（用不上）-->
                        <div>
                            <b>颜色</b>
                            <div class="colorConfig">
                                <div class="leftPart">
                                    <AuColorPicker
                                        ref="colorPicker"
                                        v-model="p.grid.color"
                                        :entry-styles="{border:'1px solid black'}" :pos="-85"
                                        :entry-respond-delay="1"
                                        :panel-click-stop-propagation="true"></AuColorPicker>
                                </div>
                            </div>
                        </div>
                        <div>
                            <b>透明</b>
                            <div class="numberConfig">
                                <div class="leftPart">
                                    <input type="range" v-model="p.grid.opacity" :min="0" :max="1" :step="0.05"/>
                                </div>
                                <div class="numberView">{{ p.grid.opacity }}</div>
                            </div>
                        </div>
                    </template>
                </div>
                <div class="gridLines">
                    <div class="gridLineType">
                        <label>
                            <input type="checkbox" v-model="p.grid.horizontal"/>
                            <span>水平线</span>
                        </label>
                        <label>
                            <input type="checkbox" v-model="p.grid.vertical"/>
                            <span>垂直线</span>
                        </label>
                    </div>
                    <div class="gridLineType">
                        <label>
                            <input type="checkbox" v-model="p.grid.rise45"/>
                            <span>上升线</span>
                        </label>
                        <label>
                            <input type="checkbox" v-model="p.grid.fall45"/>
                            <span>下降线</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="patternOps">
                <button v-if="pIdx>0" class="minor" @click="moveUpInArray(save?.patterns, pIdx)">上移纹理</button>
                <button class="cancel" @click="delPattern(p)">删除纹理</button>
            </div>
        </div>
    </div>
    <div class="newPattern">
        <button class="ok" @click="addPattern()">+新建纹理</button>
    </div>
</div>
</ConfigSection>
</template>

<style scoped lang="scss">
.patterns{
    padding: 5px;
    &>div{
        border-radius: 10px;
        margin: 16px 0px 16px 0px;
        box-shadow: 0px 0px 5px 0px #ccc;
        background-color: #eee;
        overflow: hidden;
        border: 2px solid #eee;
        &:first-child{
            margin-top: 0px;
        }
        .preview{
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 100px;
            padding: 5px;
            cursor: pointer;
            canvas{
                border-radius: 10px;
            }
            .foldBtn{
                width: 30px;
                height: 30px;
                border-radius: 6px;
                img{
                    width: 20px;
                    height: 20px;
                    margin: 5px;
                    transform: rotate(0deg);
                    user-select: none;
                }
            }
        }
        &.showDetail {
            border-color: #666;
            .preview{
                img {
                    transform: rotate(180deg);
                }
            }
        }
        .detail{
            background-color: white;
            padding: 8px;
            h3{
                font-size: 16px;
                font-weight: normal;
            }
            .name{
                display: flex;
                justify-content: center;
                align-items: center;
                input{
                    width: 120px;
                }
            }
            .dimensions{
                margin-top: 8px;
                &>div{
                    margin: 5px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    b{
                        color: #666;
                        font-size: 13px;
                    }
                }
            }
            .gridConfig{
                margin-top: 8px;
                border-radius: 5px;
                box-shadow: 0px 0px 5px 0px #ccc;
                padding: 8px;
                .gridTitle{
                    font-weight: bold;
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 8px;
                    text-align: center;
                }
                .gridSection{
                    &>div{
                        margin: 5px 0;
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        b{
                            color: #666;
                            font-size: 13px;
                            width: 40px;
                        }
                    }
                }
                .gridLines{
                    margin-top: 10px;
                    .gridLineType{
                        display: flex;
                        justify-content: space-around;
                        margin: 5px 0;
                        label{
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            font-size: 13px;
                            color: #666;
                            cursor: pointer;
                            input[type=checkbox]{
                                margin: 0;
                            }
                        }
                    }
                }
            }
            .numberConfig, .colorConfig{
                flex-grow: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
                .leftPart{
                    width: 120px;
                    display: flex;
                    justify-content: center;
                }
            }
            .numberConfig{
                .numberView{
                    width: 40px;
                }
                input[type=range]{
                    width: 120px;
                }
            }
            .patternOps{
                margin-top: 10px;
                display: flex;
                justify-content: center;
                gap: 6px;
            }
        }
    }
    &>.newPattern{
        border: none;
        display: flex;
        justify-content: center;
        button{
            flex-grow: 1;
        }
    }
}
</style>
