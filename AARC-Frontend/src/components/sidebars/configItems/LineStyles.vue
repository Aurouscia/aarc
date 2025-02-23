<script setup lang="ts">
import { Coord } from '@/models/coord';
import { LineStyle } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { moveUpInArray } from '@/utils/lang/moveUpInArray';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { storeToRefs } from 'pinia';
import { CSSProperties, onMounted, onUnmounted, ref } from 'vue';

const saveStore = useSaveStore()
const { save } = storeToRefs(saveStore)
const showDetail = ref<Record<number, boolean|undefined>>({})
const colorPicker = ref<InstanceType<typeof AuColorPicker>[]>([])
function clickContainer(){
    //点击“其他地方”关闭颜色选择器
    colorPicker.value.forEach(cp=>cp.closePanel())
}
function delLayer(lineStyle:LineStyle, layerIdx:number){
    if(window.confirm('确认删除该层级')){
        lineStyle.layers.splice(layerIdx, 1)
    }
}
function addLayer(lineStyle:LineStyle){
    lineStyle.layers.push({
        width:0.5,
        opacity:1
    })
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
const previewColors = ['red', 'green', 'blue']
let previewColorIdx = 0
function renderPreviewCvs(){
    if(!save.value?.lineStyles)
        return
    for(const s of save.value?.lineStyles){
        renderPreviewCvsOf(s)
    }
}
function renderPreviewCvsOf(lineStyle:LineStyle){
    const layers = lineStyle.layers
    if(!layers)
        return
    const cvs = document.getElementById(cvsEleId(lineStyle.id)) as HTMLCanvasElement|null
    const ctx = cvs?.getContext('2d')
    if(!cvs || !ctx)
        return
    const dynaColor = previewColors[previewColorIdx]
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, cvsWidth, cvsHeight)
    ctx.beginPath()
    ctx.lineWidth = cvsLineWidthBase
    ctx.globalAlpha = 1
    ctx.strokeStyle = dynaColor
    ctx.setLineDash([])
    ctx.lineCap = 'butt'
    ctx.moveTo(...cvsLeftCoord)
    ctx.lineTo(...cvsRightCoord)
    ctx.stroke()
    for(let i=layers.length-1; i>=0; i--){
        const layer = layers[i]
        const layerWidth = cvsLineWidthBase * (layer.width||1)
        ctx.beginPath()
        ctx.lineWidth = layerWidth
        ctx.globalAlpha = layer.opacity || 1
        if(layer.colorMode==='line')
            ctx.strokeStyle = dynaColor
        else
            ctx.strokeStyle = layer.color || 'white'
        const dashNums = parseDash(layer.dash)
        for(let i=0;i<dashNums.length;i++){
            dashNums[i] = dashNums[i]*cvsLineWidthBase
        }
        ctx.setLineDash(dashNums)
        ctx.moveTo(...cvsLeftCoord)
        ctx.lineTo(...cvsRightCoord)
        ctx.stroke()
    }
}
function parseDash(dashStr?:string):number[]{
    const res:number[] = []
    if(!dashStr)
        return res
    const parts = dashStr.split(' ')
    for(const p of parts){
        const pNum = parseFloat(p)
        if(!isNaN(pNum))
            res.push(pNum)
    }
    return res
}

let timer = 0
onMounted(()=>{
    timer = window.setInterval(()=>{
        previewColorIdx++
        if(previewColorIdx>=previewColors.length){
            previewColorIdx = 0
        }
        renderPreviewCvs()
    }, 1000)
})
onUnmounted(()=>{
    window.clearInterval(timer)
})
</script>

<template>
<div class="lineStyles" @click="clickContainer">
    <div v-for="s in save?.lineStyles">
        <div class="preview">
            <canvas :width="cvsWidth" :height="cvsHeight" :style="cvsStyle" :id="cvsEleId(s.id)"></canvas>
            <div @click="showDetail[s.id] = !showDetail[s.id]" class="sqrBtn withShadow">...</div>
        </div>
        <div v-if="showDetail[s.id]" class="detail">
            <div class="name">
                <h3>名称</h3><input v-model="s.name" placeholder="风格名称"/>
            </div>
            <div class="layers">
                <div v-for="layer,idx in s.layers" class="layer">
                    <div>
                        <h3>颜色</h3>
                        <div class="colorConfig">
                            <div class="leftPart">
                                <AuColorPicker v-if="!layer.colorMode || layer.colorMode==='fixed'"
                                    ref="colorPicker"
                                    :initial="layer.color" @done="c=>layer.color=c"
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
                        <h3>宽度</h3>
                        <div class="numberConfig">
                            <div class="leftPart">
                                <input type="range" v-model="layer.width" :min="0" :max="1" :step="0.05"/>
                            </div>
                            <div class="numberView">{{ layer.width }}</div>
                        </div>
                    </div>
                    <div>
                        <h3>透明</h3>
                        <div class="numberConfig">
                            <div class="leftPart">
                                <input type="range" v-model="layer.opacity" :min="0" :max="1" :step="0.05"/>
                            </div>
                            <div class="numberView">{{ layer.opacity }}</div>
                        </div>
                    </div>
                    <div>
                        <h3>虚线</h3>
                        <input v-model="layer.dash" class="dashConfigInput" placeholder="空格隔开的数字"/>
                    </div>
                    <div class="ops">
                        <button v-if="idx>0" class="lite lsMoveUp" @click="moveUpInArray(s.layers, idx)">上移</button>
                        <button class="lite lsDelete" @click="delLayer(s, idx)">删除</button>
                    </div>
                </div>
                <div class="ops">
                    <button class="lite" @click="addLayer(s)">新增层级</button>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.lineStyles{
    width: 100%;
    background-color: #eee;
    padding: 5px;
    &>div{
        border: 1.5px solid #666;
        border-radius: 10px;
        margin: 10px 0px 10px 0px;
        padding: 5px;
        .preview{
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 40px;
            canvas{
                border-radius: 10px;
            }
        }
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
        .layers{
            .layer{
                border: 1px solid #666;
                border-radius: 5px;
                margin: 5px 0px 0px 0px;
                &>div{
                    margin: 5px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    &>div{
                        height: 30px;
                    }
                    .colorConfig, .numberConfig{
                        flex-grow: 1;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        .leftPart{
                            width: 140px;
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
                    }
                    .dashConfigInput{
                        margin: 0px;
                        width: 150px;
                    }
                }
                &>.ops{
                    button.lsMoveUp{
                        color: #999;
                    }
                    button.lsDelete{
                        color: plum
                    }
                }
            }
            .ops{
                margin: 10px 0px 0px 0px;
                display: flex;
                justify-content: center;
                align-items: center;
                button{
                    color: olivedrab
                }
            }
        }
    }
}
</style>