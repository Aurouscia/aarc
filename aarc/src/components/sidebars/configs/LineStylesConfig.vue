<script setup lang="ts">
import { Coord } from '@/models/coord';
import { strokeStyledLine } from '@/models/cvs/common/strokeStyledLine';
import { LineStyle } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { moveUpInArray } from '@/utils/lang/moveUpInArray';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { storeToRefs } from 'pinia';
import { CSSProperties, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import convert from 'color-convert'
import { timestampMS } from '@/utils/timeUtils/timestamp';
import ConfigSection from '../configs/shared/ConfigSection.vue';
import { debounce } from '@/utils/lang/debounce';
import foldIcon from '@/assets/ui/fold.svg';

const saveStore = useSaveStore()
const { save } = storeToRefs(saveStore)
const envStore = useEnvStore()
const showDetail = ref<Record<number, boolean|undefined>>({})
const colorPicker = useTemplateRef('colorPicker')
function clickContainer(){
    //点击“其他地方”关闭颜色选择器
    colorPicker.value?.forEach(cp=>cp?.closePanel())
}
function delLayer(lineStyle:LineStyle, layerIdx:number){
    if(window.confirm('确认删除该层级')){
        lineStyle.layers.splice(layerIdx, 1)
    }
}
function addLayer(lineStyle:LineStyle){
    lineStyle.layers.unshift(getDefaultLayer())
}
function delStyle(lineStyle:LineStyle){
    if(window.confirm(`确认删除样式 ${lineStyle.name || ''}`)){
        const idx = save.value?.lineStyles?.findIndex(x=>x.id === lineStyle.id)
        if(idx!==undefined && idx>=0){
            save.value?.lineStyles?.splice(idx, 1)
        }
    }
}
function addStyle(){
    if(!save.value) return
    const newId = saveStore.getNewId()
    save.value.lineStyles ??= []
    save.value.lineStyles.push({
        id:newId,
        layers:[getDefaultLayer()]
    })
}
function getDefaultLayer():LineStyle['layers'][number]{
    return {
        color: '#FFFFFF',
        colorMode: 'fixed',
        width:0.5,
        opacity:1
    }
}

function cvsEleId(styleId:number){
    return `lineStylePreviewCvs_${styleId}`
}
const cvsWidth = 400
const cvsHeight = 60
const cvsStyle:CSSProperties = {
    width: '200px',
    height: '30px'
}
const cvsCenterY = cvsHeight/2
const cvsLineWidthBase = cvsHeight/3
const cvsLRMargin = cvsWidth/10
const cvsLeftX = cvsLRMargin
const cvsRightX = cvsWidth - cvsLRMargin
const cvsLeftCoord:Coord = [cvsLeftX, cvsCenterY]
const cvsRightCoord:Coord = [cvsRightX, cvsCenterY]
function renderPreviewCvs(){
    if(!save.value?.lineStyles)
        return
    const hue = timestampMS()/20 % 360
    const dynaColor = '#'+convert.hsl.hex([hue, 80, 50])
    for(const s of save.value?.lineStyles){
        renderPreviewCvsOf(s, dynaColor)
    }
}
function renderPreviewCvsOf(lineStyle:LineStyle, dynaColor:string){
    const layers = lineStyle.layers
    if(!layers)
        return
    const cvs = document.getElementById(cvsEleId(lineStyle.id)) as HTMLCanvasElement|null
    const ctx = cvs?.getContext('2d')
    if(!cvs || !ctx)
        return
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, cvsWidth, cvsHeight)
    ctx.beginPath()
    ctx.moveTo(...cvsLeftCoord)
    ctx.lineTo(...cvsRightCoord)
    strokeStyledLine(ctx, {
        lineStyle: lineStyle,
        lineWidthBase: cvsLineWidthBase,
        dynaColor: dynaColor,
        fixedColorConverter: (c)=>c
    })
}

const styleNameMaxLength = 8
function checkStyleName(s:LineStyle){
    if(s.name && s.name.length > styleNameMaxLength){
        s.name = s.name.substring(0, styleNameMaxLength)
    }
}

function rerender(){
    envStore.rerender([], [])
    renderPreviewCvs()
}
const debouncedRerender = debounce(rerender, 600)
watch(()=>save.value?.lineStyles, ()=>{
    debouncedRerender()
}, {deep: true})

let timer = 0
onMounted(()=>{
    renderPreviewCvs()
    timer = window.setInterval(()=>{
        renderPreviewCvs()
    }, 100)
})
onUnmounted(()=>{
    window.clearInterval(timer)
})
</script>

<template>
<ConfigSection :title="'线路样式'">
<div class="lineStyles" @click="clickContainer">
    <div v-for="s,sIdx in save?.lineStyles" :key="s.id" :class="{showDetail:showDetail[s.id]}">
        <div class="preview" @click="showDetail[s.id] = !showDetail[s.id]">
            <canvas :width="cvsWidth" :height="cvsHeight" :style="cvsStyle" :id="cvsEleId(s.id)"></canvas>
            <div class="foldBtn">
                <img :src="foldIcon"/>
            </div>
        </div>
        <div v-if="showDetail[s.id]" class="detail">
            <div class="name">
                <h3>风格名</h3><input v-model="s.name" placeholder="必填" @blur="checkStyleName(s)"/>
            </div>
            <div class="layersOps">
                <button class="ok" @click="addLayer(s)">+层级</button>
                <button v-if="sIdx>0" class="minor" @click="moveUpInArray(save?.lineStyles, sIdx)">上移风格</button>
                <button class="cancel" @click="delStyle(s)">删除风格</button>
            </div>
            <div class="layers">
                <div v-for="layer,idx in s.layers" class="layer">
                    <div class="layerHead">
                        <b v-if="idx == 0">—顶层—</b>
                        <b v-else-if="idx == s.layers.length-1">—底层—</b>
                        <b v-else>—第{{idx+1}}层—</b>
                        <div class="ops">
                            <button v-if="idx>0" class="lite lsMoveUp" @click="moveUpInArray(s.layers, idx)">上移</button>
                            <button class="lite lsDelete" @click="delLayer(s, idx)">删除</button>
                        </div>
                    </div>
                    <div>
                        <b>颜色</b>
                        <div class="colorConfig">
                            <div class="leftPart">
                                <AuColorPicker v-if="!layer.colorMode || layer.colorMode==='fixed'"
                                    ref="colorPicker"
                                    v-model="layer.color"
                                    :entry-styles="{border:'1px solid black'}" :pos="-85"
                                    :entry-respond-delay="1"
                                    :panel-click-stop-propagation="true"></AuColorPicker>
                                <div v-else-if="layer.colorMode==='line'" class="following">跟随线路颜色</div>
                            </div>
                            <button v-if="layer.colorMode!=='line'" class="lite" @click="layer.colorMode='line'">跟随线路</button>
                            <button v-else class="lite" @click="layer.colorMode='fixed'">取消跟随</button>
                        </div>
                    </div>
                    <div>
                        <b>宽度</b>
                        <div class="numberConfig">
                            <div class="leftPart">
                                <input type="range" v-model="layer.width" :min="0" :max="1" :step="0.05"/>
                            </div>
                            <div class="numberView">{{ layer.width }}</div>
                        </div>
                    </div>
                    <div>
                        <b>透明</b>
                        <div class="numberConfig">
                            <div class="leftPart">
                                <input type="range" v-model="layer.opacity" :min="0" :max="1" :step="0.05"/>
                            </div>
                            <div class="numberView">{{ layer.opacity }}</div>
                        </div>
                    </div>
                    <div>
                        <b>虚线</b>
                        <input v-model="layer.dash" class="dashConfigInput" placeholder="空格隔开的数字"/>
                    </div>
                    <div v-if="layer.dash">
                        <b>虚线端部</b>
                        <select v-model="layer.dashCap">
                            <option :value="undefined">方头</option>
                            <option :value="'round'">圆头</option>
                        </select>
                    </div>
                    <div v-else>
                        <b>纹理</b>
                        <select v-model="layer.pattern">
                            <option :value="undefined">无</option>
                            <option v-for="p in save?.patterns" :value="p.id">{{ p.name }}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="newStyle">
        <button class="ok" @click="addStyle()">+新建样式</button>
    </div>
</div>
</ConfigSection>
</template>

<style scoped lang="scss">
.lineStyles{
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
            height: 30px;
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
                    border-radius: 0px;
                    border-width: 0px 0px 1px 0px;
                }
            }
            .layers{
                .layer{
                    border-radius: 5px;
                    margin: 8px 0px 0px 0px;
                    box-shadow: 0px 0px 5px 0px #ccc;
                    padding-bottom: 1px;
                    &>div{
                        margin: 5px;
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        b{
                            color: #666;
                            font-size: 13px;
                        }
                        &>div{
                            height: 34px;
                        }
                        .colorConfig, .numberConfig{
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
                        .colorConfig{
                            .following{
                                color: #999;
                                font-size: 14px;
                            }
                            button.lite{
                                flex-grow: 0;
                                font-size: 14px;
                                text-decoration: underline;
                                &:hover{
                                    color:black
                                }
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
                        .dashConfigInput{
                            margin: 0px;
                            width: 120px;
                        }
                    }
                    .layerHead{
                        background-color: #f3f3f3;
                        margin: 0px;
                        padding: 0px 6px;
                        b{
                            font-size: 15px;
                        }
                        .ops{
                            flex-grow: 1;
                            display: flex;
                            justify-content: flex-end;
                            align-items: center;
                            gap: 6px;
                        }
                        button{
                            font-size: 14px;
                        }
                        button.lsMoveUp{
                            color: #666;
                        }
                        button.lsDelete{
                            color: plum
                        }
                    }
                }
            }
            .layersOps{
                margin-top: 10px;
                display: flex;
                justify-content: center;
                gap: 6px;
            }
        }
    }
    &>.newStyle{
        border: none;
        display: flex;
        justify-content: center;
        button{
            flex-grow: 1;
        }
    }
}
</style>