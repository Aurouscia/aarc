<script setup lang="ts">
import SideBar from '@/components/common/SideBar.vue';
import { ControlPoint } from '@/models/save';
import { ref } from 'vue';

const sidebar = ref<InstanceType<typeof SideBar>>()

const editing = ref<ControlPoint>()
function startEditing(pt: ControlPoint) {
    editing.value = pt
    if(editing.value.nameSize===undefined)
        editing.value.nameSize = 0
    sidebar.value?.extend()
}

const emit = defineEmits<{
    (e:'changed'):void
}>()
defineExpose({
    startEditing
})
</script>

<template>
<SideBar ref="sidebar">
    <div v-if="editing">
        <h2>点坐标</h2>
        <div class="optionSection">
            <table class="fullWidth"><tbody>
                <tr>
                    <td>坐标</td>
                    <td class="coord">
                        <input type="number" v-model="editing.pos[0]" @change="emit('changed')"/><br/>
                        <input type="number" v-model="editing.pos[1]" @change="emit('changed')"/>
                    </td>
                </tr>
            </tbody></table>
        </div>
        <h2>站名尺寸</h2>
        <div class="optionSection">
            <div class="textSize" v-if="editing.nameSize!==undefined">
                <input type="range" v-model="editing.nameSize" :min="0" :max="3" :step="0.25" @change="emit('changed')"/>
                <input type="number" v-model="editing.nameSize" :min="0" :max="3" @change="emit('changed')"/>
            </div>
            <div class="smallNote" style="text-align: center;">
                设为0使用默认大小<br/>
                （即车站团内最大的“线路设置站名尺寸”）<br/><br/>
                此处的设置仅影响本点，若站名被拖入<br/>车站团内其他点，则需要重新设置
            </div>
        </div>
    </div>
    <div class="smallNote" style="text-align: center;">
        <b>右键点击站名</b>可直接打开本菜单<br/>
        <b>右键点击站点</b>可以旋转站点<br/>
        <b>右键+ctrl点击站点</b>可以切换站点显示
    </div>
</SideBar>
</template>

<style scoped lang="scss">
@use './shared/options.scss';
</style>