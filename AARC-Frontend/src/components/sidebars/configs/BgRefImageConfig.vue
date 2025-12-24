<script setup lang="ts">
import { useConfigStore } from '@/models/stores/configStore';
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { watch } from 'vue';
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';
import { useSaveStore } from '@/models/stores/saveStore';

const { config } = storeToRefs(useConfigStore())
const { cvsWidth } = storeToRefs(useSaveStore())
const { preventLeaving } = usePreventLeavingUnsavedStore()

watch(() => config.value.bgRefImage, () => {
    preventLeaving()
}, { deep: true })

watch(() => config.value.bgRefImage.url, (newVal, oldVal)=>{
    if(newVal && !oldVal){
        const c = config.value.bgRefImage
        if(!c.left && !c.right && !c.top && !c.bottom && !c.width && !c.height){
            c.left = 0
            c.top = 0
            c.width = cvsWidth.value
        }
        if(!c.opacity){
            c.opacity = 30
        }
    }
})
</script>

<template>
<ConfigSection :title="'背景参考图'">
<table class="fullWidth bgRefImage"><tbody>
    <tr>
        <td class="smallNote" colspan="2">
            用于参考的底图，仅在编辑器内显示<br/>
            需要先上传图片到aarc资源库<br/>
            或图床，再复制链接到此处
        </td>
    </tr>
    <tr>
        <td colspan="2">
            <b>图片链接</b>
            <input v-model.lazy.trim="config.bgRefImage.url"/>
            <div class="smallNote">
                复杂svg图片将导致缩放卡顿<br/>
                建议使用png/webp/jpg格式
            </div>
        </td>
    </tr>
    <tr>
        <td>不透<br/>明度</td>
        <td>
            <input v-model.number="config.bgRefImage.opacity" type="range" :min="0" :max="100" :step="5"/><br/>
            {{ config.bgRefImage.opacity }}%
        </td>
    </tr>
    <tr>
        <td>位置<br/>偏移</td>
        <td>
            <div class="bgRefImageOffsets">
                <div>
                    左<input v-model.number.lazy="config.bgRefImage.left" type="number"/>
                </div>
                <div>
                    右<input v-model.number.lazy="config.bgRefImage.right" type="number"/>
                </div>
                <div>
                    上<input v-model.number.lazy="config.bgRefImage.top" type="number"/>
                </div>
                <div>
                    下<input v-model.number.lazy="config.bgRefImage.bottom" type="number"/>
                </div>
                <div>
                    宽<input v-model.number.lazy="config.bgRefImage.width" type="number"/>
                </div>
                <div>
                    高<input v-model.number.lazy="config.bgRefImage.height" type="number"/>
                </div>
            </div>

        </td>
    </tr>
    <tr>
        <td colspan="2">
            <div class="smallNoteVital">
                建议：仅填“左/上/宽”即可
            </div>
            <div class="smallNote">
                “上下左右”为底图相对画布边缘偏移像素数<br/>
                正数表示向内，负数表示向外<br/>
                （若显示异常，请填写更多位置参数以修复）
            </div>
        </td>
    </tr>
</tbody></table>
</ConfigSection>
</template>

<style lang="scss" scoped>
.bgRefImage{
    .bgRefImageOffsets{
        display: flex;
        flex-direction: column;
        gap: 10px;
        input{
            width: 80px;
            &::placeholder {
                color: #aaa;
            }
        }
    }
}
</style>