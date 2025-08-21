<script setup lang="ts">
import { ref } from 'vue';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { useEnvStore } from '@/models/stores/envStore';

const envStore = useEnvStore()

const backgroundPicker = ref<InstanceType<typeof AuColorPicker>>()
const normalStaPicker = ref<InstanceType<typeof AuColorPicker>>()
const transferStaPicker = ref<InstanceType<typeof AuColorPicker>>()
const staNamePicker = ref<InstanceType<typeof AuColorPicker>>()
const staEngNamePicker = ref<InstanceType<typeof AuColorPicker>>()
const staFillPicker = ref<InstanceType<typeof AuColorPicker>>()
    
const waterTerrainPicker = ref<InstanceType<typeof AuColorPicker>>()
const greenLandTerrainPicker = ref<InstanceType<typeof AuColorPicker>>()
const areaTerrainPicker = ref<InstanceType<typeof AuColorPicker>>()

    
import { useConfigStore } from '@/models/stores/configStore';
import { storeToRefs } from 'pinia';

const configStore = useConfigStore()
const { config } = storeToRefs(configStore)

const showStyleConfig = ref(false)
function changeGlobalColor(type:string,c:string){
    if(type=='background'){
        config.value.bgColor=c
    }
    else if(type=='staName'){
        config.value.staNameColor=c
    }
    else if(type=='staEngName'){
        config.value.staNameSubColor=c
    }
    else if(type=='staFill'){
        config.value.ptStaFillColor=c
    }
    else if(type=='ptExchange'){
        config.value.ptStaExchangeLineColor=c
    }
    else if(type=='normalSta'){
        config.value.ptStaNormalStaColor=c
    }
    else if(type=='waterTerrain'){
        config.value.colorPresetWater=c
    }
    else if(type=='areaTerrain'){
        config.value.colorPresetArea=c
    }
    else if(type=='greenLandTerrain'){
        config.value.colorPresetGreenland=c
    }
    envStore.rerender([], [])
}
function changeToNight(){
    if(!window.confirm(`确定将颜色设置更换为黑夜模式？（即把背景颜色改成黑色，并且对文本和站点颜色做出相应调整）`)){
        return
    }
    config.value.bgColor='#000'
    config.value.staNameColor='#fff'
    config.value.staNameSubColor='#ccc'
    config.value.ptStaFillColor='#000'
    config.value.ptStaExchangeLineColor='#ccc'
}
</script>
<template>
<h2 :class="{sectorShown:showStyleConfig}" @click="showStyleConfig =!showStyleConfig">
    <div class="shownStatusIcon">{{ showStyleConfig? '×':'+' }}</div>
    <div>默认样式</div>
</h2>
<div v-show="showStyleConfig" @click="staNamePicker?.closePanel();staEngNamePicker?.closePanel();staFillPicker?.closePanel();backgroundPicker?.closePanel();
transferStaPicker?.closePanel();normalStaPicker?.closePanel();areaTerrainPicker?.closePanel();waterTerrainPicker?.closePanel();greenLandTerrainPicker?.closePanel()">
<h3>颜色设置</h3>
<table class="fullWidth bgRefImage">
    <tbody>
        
    <tr>
        <td>
            背景
        </td>
        <td class="colorPickerTd">
                        <AuColorPicker ref="backgroundPicker" :initial="config.bgColor" :pos="-120"
                            @change="c=>changeGlobalColor('background', c)" @done="c=>changeGlobalColor('background', c)"
                            :panel-click-stop-propagation="true" :entry-respond-delay="1">
                        </AuColorPicker>
                    </td>
    </tr>
    <tr><td colspan="2"><b>站名</b></td></tr>
    <tr>
        <td>
            主站名
        </td>
        <td class="colorPickerTd">
                        <AuColorPicker ref="staNamePicker" :initial="config.staNameColor" :pos="-120"
                            @change="c=>changeGlobalColor('staName', c)" @done="c=>changeGlobalColor('staName', c)"
                            :panel-click-stop-propagation="true" :entry-respond-delay="1">
                        </AuColorPicker>
                    </td>
    </tr>
    <tr>
        <td>
            副站名
        </td>
        <td class="colorPickerTd">
                        <AuColorPicker ref="staEngNamePicker" :initial="config.staNameSubColor" :pos="-120"
                            @change="c=>changeGlobalColor('staEngName', c)" @done="c=>changeGlobalColor('staEngName', c)"
                            :panel-click-stop-propagation="true" :entry-respond-delay="1">
                        </AuColorPicker>
                    </td>
    </tr>
    <tr><td colspan="2"><b>车站</b></td></tr>
    <tr>
        <td>
            车站填充
        </td>
        <td class="colorPickerTd">
                        <AuColorPicker ref="staFillPicker" :initial="config.ptStaFillColor" :pos="-120"
                            @change="c=>changeGlobalColor('staFill', c)" @done="c=>changeGlobalColor('staFill', c)"
                            :panel-click-stop-propagation="true" :entry-respond-delay="1">
                        </AuColorPicker>
                    </td>
    </tr>
    <tr>
        <td>
            普通站描边跟随线路颜色
        </td>
        <td>
            <input type="checkbox" v-model="config.ptStaNormalStaFollowLineColor">
        </td>
    </tr>
    <tr v-if="!config.ptStaNormalStaFollowLineColor">
        <td>
            普通站描边
        </td>
        <td class="colorPickerTd">
                    <AuColorPicker ref="normalStaPicker" :initial="config.ptStaNormalStaColor" :pos="-120"
                        @change="c=>changeGlobalColor('normalSta', c)" @done="c=>changeGlobalColor('normalSta', c)"
                        :panel-click-stop-propagation="true" :entry-respond-delay="1">
                    </AuColorPicker>
                </td>
    </tr>
    <tr>
        <td>
            换乘站描边
        </td>
        <td class="colorPickerTd">
                        <AuColorPicker ref="transferStaPicker" :initial="config.ptStaExchangeLineColor" :pos="-120"
                            @change="c=>changeGlobalColor('ptExchange', c)" @done="c=>changeGlobalColor('ptExchange', c)"
                            :panel-click-stop-propagation="true" :entry-respond-delay="1">
                        </AuColorPicker>
                    </td>
    </tr>
    <tr><td colspan="2"><b>地形</b></td></tr>
    <tr>
        <td>
            水体
        </td>
        <td class="colorPickerTd">
            <AuColorPicker ref="waterTerrainPicker" :initial="config.colorPresetWater" :pos="-120"
                @change="c=>changeGlobalColor('waterTerrain', c)" @done="c=>changeGlobalColor('waterTerrain', c)"
                :panel-click-stop-propagation="true" :entry-respond-delay="1">
            </AuColorPicker>
        </td>
    </tr>
    <tr>
        <td>
            绿地
        </td>
        <td class="colorPickerTd">
            <AuColorPicker ref="greenLandTerrainPicker" :initial="config.colorPresetGreenland" :pos="-120"
                @change="c=>changeGlobalColor('greenLandTerrain', c)" @done="c=>changeGlobalColor('greenLandTerrain', c)"
                :panel-click-stop-propagation="true" :entry-respond-delay="1">
            </AuColorPicker>
        </td>
    </tr>
    <tr>
        <td>
            区域
        </td>
        <td class="colorPickerTd">
            <AuColorPicker ref="areaTerrainPicker" :initial="config.colorPresetArea" :pos="-120"
                @change="c=>changeGlobalColor('areaTerrain', c)" @done="c=>changeGlobalColor('areaTerrain', c)"
                :panel-click-stop-propagation="true" :entry-respond-delay="1">
            </AuColorPicker>
        </td>
    </tr>
</tbody>
</table>
<h3>去白边设置</h3>
<table class="fullWidth bgRefImage" >
<tbody>
    <tr>
        <td>
            线路/地形
        </td>
        <td>
            <input type="checkbox" v-model="config.lineRemoveCarpet">
        </td>
    </tr>
    <tr>
        <td>
            文本标签
        </td>
        <td>
             <input type="checkbox" v-model="config.textTagRemoveCarpet">
        </td>
    </tr>
    <tr>
        <td>
            站名
        </td>
        <td>
             <input type="checkbox" v-model="config.staNameRemoveCarpet">
        </td>
    </tr>
    </tbody>
</table>
<h3>一键设置</h3>
<button style="background-color: black;color:white" @click="changeToNight()">黑夜模式</button><br>
</div>
</template>
<style lang="scss" scoped>
@use './shared/configSection.scss';
</style>