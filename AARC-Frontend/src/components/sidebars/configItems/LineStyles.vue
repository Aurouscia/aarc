<script setup lang="ts">
import { Coord } from '@/models/coord';
import { strokeStyledLine } from '@/models/cvs/common/strokeStyledLine';
import { LineStyle } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { moveUpInArray } from '@/utils/lang/moveUpInArray';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { storeToRefs } from 'pinia';
import { CSSProperties, onMounted, onUnmounted, ref } from 'vue';
import { hsl } from 'color-convert'
import { timestampMS } from '@/utils/timeUtils/timestamp';

const saveStore = useSaveStore()
const { save } = storeToRefs(saveStore)
const envStore = useEnvStore()
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
    const newId = saveStore.getNewId()
    save.value?.lineStyles?.push({
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
    const dynaColor = '#'+hsl.hex([hue, 80, 50])
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
    strokeStyledLine(ctx, lineStyle, cvsLineWidthBase, dynaColor)
}

const styleNameMaxLength = 8
function checkStyleName(s:LineStyle){
    if(s.name && s.name.length > styleNameMaxLength){
        s.name = s.name.substring(0, styleNameMaxLength)
    }
}

function rr(){
    envStore.rerender([], [])
    renderPreviewCvs()
}

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
<div class="lineStyles" @click="clickContainer">
    <div v-for="s,sIdx in save?.lineStyles" :key="s.id">
        <div class="preview">
            <canvas :width="cvsWidth" :height="cvsHeight" :style="cvsStyle" :id="cvsEleId(s.id)"></canvas>
            <div @click="showDetail[s.id] = !showDetail[s.id]" class="sqrBtn withShadow">...</div>
        </div>
        <div v-if="showDetail[s.id]" class="detail">
            <div class="name">
                <h3>名称</h3><input v-model="s.name" placeholder="风格名称(必填)" @blur="checkStyleName(s);rr()"/>
            </div>
            <div class="layers">
                <div v-for="layer,idx in s.layers" class="layer">
                    <div>
                        <h3>颜色</h3>
                        <div class="colorConfig">
                            <div class="leftPart">
                                <AuColorPicker v-if="!layer.colorMode || layer.colorMode==='fixed'"
                                    ref="colorPicker" @change="c=>layer.color=c"
                                    :initial="layer.color" @done="c=>{layer.color=c;rr()}"
                                    :entry-styles="{border:'1px solid black'}" :pos="-85"
                                    :entry-respond-delay="1"
                                    :panel-click-stop-propagation="true"></AuColorPicker>
                                <div v-else-if="layer.colorMode==='line'" class="following">跟随线路颜色</div>
                            </div>
                            <button v-if="layer.colorMode!=='line'" class="lite" @click="layer.colorMode='line';rr()">跟随线路</button>
                            <button v-else class="lite" @click="layer.colorMode='fixed';rr()">取消跟随</button>
                        </div>
                    </div>
                    <div>
                        <h3>宽度</h3>
                        <div class="numberConfig">
                            <div class="leftPart">
                                <input type="range" v-model="layer.width" :min="0" :max="1" :step="0.05" @blur="rr()"/>
                            </div>
                            <div class="numberView">{{ layer.width }}</div>
                        </div>
                    </div>
                    <div>
                        <h3>透明</h3>
                        <div class="numberConfig">
                            <div class="leftPart">
                                <input type="range" v-model="layer.opacity" :min="0" :max="1" :step="0.05" @blur="rr()"/>
                            </div>
                            <div class="numberView">{{ layer.opacity }}</div>
                        </div>
                    </div>
                    <div>
                        <h3>虚线</h3>
                        <input v-model="layer.dash" class="dashConfigInput" placeholder="空格隔开的数字" @blur="rr()"/>
                    </div>
                    <div class="ops">
                        <button v-if="idx>0" class="lite lsMoveUp" @click="moveUpInArray(s.layers, idx);rr()">上移</button>
                        <button class="lite lsDelete" @click="delLayer(s, idx);rr()">删除</button>
                    </div>
                </div>
            </div>
            <div class="ops">
                <button class="ok" @click="addLayer(s);rr()">+层级</button>
                <button v-if="sIdx>0" class="minor" @click="moveUpInArray(save?.lineStyles, sIdx);rr()">上移</button>
                <button class="cancel" @click="delStyle(s);rr()">删除</button>
            </div>
        </div>
    </div>
    <div class="newStyle">
        <button class="ok" @click="addStyle();rr()">+新建样式</button>
    </div>
</div>
</template>

<style scoped lang="scss">
.lineStyles{
    background-color: #eee;
    padding: 5px;
    &>div{
        border: 2px solid #666;
        border-radius: 10px;
        margin: 10px 0px 10px 0px;
        padding: 5px;
        .preview{
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 30px;
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
                &>.ops{
                    button.lsMoveUp{
                        color: #999;
                    }
                    button.lsDelete{
                        color: plum
                    }
                }
            }
        }
        .ops{
            margin: 10px 0px 0px 0px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
        }
    }
    &>.newStyle{
        border: none;
        display: flex;
        justify-content: center;
    }
}
</style>