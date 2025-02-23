<script setup lang="ts">
import { LineStyle } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { moveUpInArray } from '@/utils/lang/moveUpInArray';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

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
</script>

<template>
<div class="lineStyles" @click="clickContainer">
    <div v-for="s in save?.lineStyles">
        <div class="preview">
            <canvas :width="200" :height="30"></canvas>
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
                                <AuColorPicker v-if="layer.color"
                                    ref="colorPicker"
                                    :initial="layer.color" @done="c=>layer.color=c"
                                    :entry-styles="{border:'1px solid black'}" :pos="-85"
                                    :entry-respond-delay="1"
                                    :panel-click-stop-propagation="true"></AuColorPicker>
                                <div v-else class="following">跟随线路颜色</div>
                            </div>
                            <button v-if="layer.color" class="lite" @click="layer.color=undefined">跟随线路</button>
                            <button v-else class="lite" @click="layer.color='#FFFFFF'">取消跟随</button>
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