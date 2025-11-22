<script setup lang="ts">
import { ref } from 'vue';
import SideBar from '../common/SideBar.vue';
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { usePointLinkStore } from '@/models/stores/pointLinkStore';
import { ControlPointLinkType } from '@/models/save';

const envStore = useEnvStore()
const pointLinkStore = usePointLinkStore()
const { creatingLinkType } = storeToRefs(pointLinkStore)

const replacedObject=ref(['stationName'])
const replacedMainSub=ref(['mainName'])
const oldString=ref('')
const newString=ref('')
const autoRegenPinyin=ref(false)

function fd(){
    sidebar.value?.fold()
}

const sidebar = ref<InstanceType<typeof SideBar>>()
defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
</script>

<template>
<SideBar ref="sidebar">
    <div class="toolItem">
        <div class="smallNote">用于添加标题/作者等信息，请勿用于标注站名</div>
        <div class="smallNote">需要线路/地形名称标签，请点击线路/地形创建</div>
        <button @click="envStore.createTextTag();fd()">创建文本标签</button>
    </div>
    <div class="toolItem">
        <div v-if="creatingLinkType===ControlPointLinkType.cluster" class="smallNote">
            选择“车站团”模式时，连线中央会有标记用细线，其仅在编辑器可见，导出时会隐藏
        </div>
        <select v-model="creatingLinkType">
            <option :value="ControlPointLinkType.fat">粗线</option>
            <option :value="ControlPointLinkType.thin">细线</option>
            <option :value="ControlPointLinkType.dot">虚线(原色)</option>
            <option :value="ControlPointLinkType.dotCover">虚线(覆盖)</option>
            <option :value="ControlPointLinkType.cluster">车站团</option>
        </select>
        <button @click="pointLinkStore.startCreatingPtLink();fd()">创建车站间连线</button>
    </div>
    <div class="toolItem">
        <div class="smallNote">可用于创建带折角/分叉的车站间连线</div>
        <button @click="envStore.createPlainPt();fd()">创建控制点</button>
    </div>
    <div class="toolItem">
        <div class="smallNote" style="text-align: center;">为所有没有站名的车站创建临时数字名<br>从当前最大的数字名开始自增填写</div>
        <button @click="envStore.enterBidNumber();fd();envStore.rerender()">生成竞标号</button>
    </div>
    <div class="toolItem">
        <div class="smallNote">替换文本内容</div>
        <table>
            <tbody>
                <tr>
                    <td>
                        对象
                    </td>
                    <td>
                        <label>
                            站名<input type="checkbox" checked value="stationName" v-model="replacedObject">
                        </label>
                        <br>
                        <label>
                            线名<input type="checkbox" checked value="lineName" v-model="replacedObject">
                        </label>
                        <br>
                        <label>
                            地形名<input type="checkbox" checked value="terrainName" v-model="replacedObject">
                        </label>
                        <br>
                        <label>
                            文本标签<input type="checkbox" checked value="textTag" v-model="replacedObject">
                        </label>
                    </td>
                </tr>
                <tr>
                    <td>
                        主副
                    </td>
                    <td>
                        <label>
                            主名<input type="checkbox"  value="mainName" v-model="replacedMainSub">
                        </label>
                        <br>
                        <label>
                            副名<input type="checkbox"  value="subName" v-model="replacedMainSub">
                        </label>
                    </td>
                </tr>
                <tr hidden>
                    <td>
                        更新翻译
                    </td>
                    <td>
                        <input type="checkbox" value="true" v-model="autoRegenPinyin">
                    </td>
                </tr>
                <tr>
                    <td>
                        替换：
                    </td>
                    <td>
                        <input v-model="oldString" class="replaceStringInput">
                    </td>
                </tr>
                <tr>
                    <td>
                        为：
                    </td>
                    <td>
                        <input v-model="newString" class="replaceStringInput">
                    </td>
                </tr>
            </tbody>
        </table>
        <button @click="envStore.replaceAllText(replacedObject,replacedMainSub,oldString,newString,autoRegenPinyin);fd();envStore.rerender()">全部替换</button>
    </div>
    <div class="toolItem">
        <button class="off">创建区间类型标记</button>
        <div class="smallNote">后续更新，敬请期待</div>
    </div>
</SideBar>
</template>

<style scoped lang="scss">
.toolItem{
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid #aaa;
    align-items: center;
    padding: 12px;
}
.replaceStringInput{
    width: 8em;
}
</style>