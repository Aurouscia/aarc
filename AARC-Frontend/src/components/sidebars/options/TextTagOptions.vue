<script setup lang="ts">
import { TextTag } from '@/models/save';
import { ref } from 'vue';
import SideBar from '../../common/SideBar.vue';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { useConfigStore } from '@/models/stores/configStore';

const cs = useConfigStore()

const sidebar = ref<InstanceType<typeof SideBar>>()
const picker1 = ref<InstanceType<typeof AuColorPicker>>()
const picker2 = ref<InstanceType<typeof AuColorPicker>>()

const editing = ref<TextTag>()
function startEditing(tag: TextTag) {
    editing.value = tag
    if(!tag.textOp) 
        tag.textOp = { size:1, color: cs.config.textTagFontColorHex }
    if(!tag.textSOp)
        tag.textSOp = { size:1, color: cs.config.textTagSubFontColorHex }
    picker1.value?.enforceTo(tag.textOp?.color || '#000000')
    picker2.value?.enforceTo(tag.textSOp?.color || '#000000')
    sidebar.value?.extend()
}

function colorChangeHandler(from: 'main'|'sub', c:string){
    if(!editing.value?.textOp || !editing.value.textSOp)
        return
    emit('changed')
    if(from==='main'){
        editing.value.textOp.color = c
    }else{
        editing.value.textSOp.color = c
    }
}

const emit = defineEmits<{
    (e:'changed'):void
}>()
defineExpose({
    startEditing
})
</script>

<template>
<SideBar ref="sidebar" @click="picker1?.closePanel();picker2?.closePanel()">
    <div v-if="editing">
        <h2>标签设置</h2>
        <div class="optionSection">
            <table class="fullWidth"><tbody>
                <tr>
                    <td>坐标</td>
                    <td class="textTagCoord">
                        <input type="number" v-model="editing.pos[0]" @change="emit('changed')"/><br/>
                        <input type="number" v-model="editing.pos[1]" @change="emit('changed')"/>
                    </td>
                </tr>
            </tbody></table>
        </div>
        <h2>主文字样式</h2>
        <div class="optionSection">
            <table class="fullWidth"><tbody>
                <tr>
                    <td>颜色</td>
                    <td class="colorPickerTd">
                        <AuColorPicker ref="picker1" :initial="editing.textOp?.color" :pos="-120"
                            @change="c=>colorChangeHandler('main', c)" @done="c=>colorChangeHandler('main', c)"
                            :panel-click-stop-propagation="true" :entry-respond-delay="1">
                        </AuColorPicker>
                    </td>
                </tr>
                <tr>
                    <td>大小</td>
                    <td>
                        <div class="textSize" v-if="editing.textOp">
                            <input type="range" v-model="editing.textOp.size" :min="0.5" :max="5" :step="0.25" @change="emit('changed')"/>
                            <input type="number" v-model="editing.textOp.size" :min="0.5" :max="16" @change="emit('changed')"/>
                        </div>
                    </td>
                </tr>
            </tbody></table>
        </div>
        <h2>副文字样式</h2>
        <div class="optionSection">
            <table class="fullWidth"><tbody>
                <tr>
                    <td>颜色</td>
                    <td class="colorPickerTd">
                        <AuColorPicker ref="picker2" :initial="editing.textSOp?.color" :pos="-120"
                            @change="c=>colorChangeHandler('sub', c)" @done="c=>colorChangeHandler('sub', c)"
                            :panel-click-stop-propagation="true" :entry-respond-delay="1">
                        </AuColorPicker>
                    </td>
                </tr>
                <tr>
                    <td>大小</td>
                    <td>
                        <div class="textSize" v-if="editing.textSOp">
                            <input type="range" v-model="editing.textSOp.size" :min="0.5" :max="5" :step="0.25" @change="emit('changed')"/>
                            <input type="number" v-model="editing.textSOp.size" :min="0.5" :max="16" @change="emit('changed')"/>
                        </div>
                    </td>
                </tr>
            </tbody></table>
        </div>
    </div>
</SideBar>
</template>

<style scoped lang="scss">
.optionSection{
    border-bottom: 1px solid #aaa;
    padding: 10px;
    margin-bottom: 10px;
}
td.colorPickerTd{
    display: flex;
    justify-content: center;
    padding: 10px;
}
.textSize{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    input[type=range]{
        margin: 0px;
    }
    input[type=number]{
        padding: 1px;
        margin: 0px;
        width: 70px;
        text-align: center;
    }
}
.textTagCoord{
    input{
        width: 100px;
    }
}
h2{
    text-align: center;
    font-size: 18px;
}
</style>