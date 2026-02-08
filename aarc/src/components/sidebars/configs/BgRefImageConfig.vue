<script setup lang="ts">
import { useConfigStore } from '@/models/stores/configStore';
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { ref, watch } from 'vue';
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';
import { useSaveStore } from '@/models/stores/saveStore';
import { checkUrlIsImage } from '@/utils/urlUtils/checkUrl';
import { bytesFromMB } from '@/utils/dataUtils/fileSizeConvert';
import { convertToProxyUrlIfNeeded } from '@/utils/urlUtils/proxyUrl';

const { config } = storeToRefs(useConfigStore())
const { cvsWidth } = storeToRefs(useSaveStore())
const { preventLeaving } = usePreventLeavingUnsavedStore()

const urlWarn = ref<string>()

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
    if(newVal){
        let urlProxied = convertToProxyUrlIfNeeded(newVal, 'icon')
        checkUrlIsImage(urlProxied, bytesFromMB(30)).then(res=>{
            urlWarn.value = res
        })
    }
    else
        urlWarn.value = undefined
})
</script>

<template>
<ConfigSection :title="'背景参考图'">
<table class="fullWidth bgRefImage"><tbody>
    <tr>
        <td class="smallNote" colspan="2">
            用于参考的底图<br/>
            需要先上传图片到aarc资源库<br/>
            或图床，再复制链接到此处
        </td>
    </tr>
    <tr>
        <td colspan="2">
            <b>图片链接</b>
            <textarea v-model.lazy.trim="config.bgRefImage.url" class="urlInput" rows="3"></textarea>
            <div v-if="!config.bgRefImage.url" class="smallNote">
                复杂svg图片将导致缩放卡顿<br/>
                建议使用png/webp/jpg格式
            </div>
            <div v-else-if="urlWarn" class="smallNoteVital">链接可能存在异常：{{ urlWarn }}</div>
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
        <td>用于<br/>导出</td>
        <td>
            <input v-model="config.bgRefImage.export" type="checkbox"/>
            <div class="smallNote">勾选时，图片需要时间重新加载</div>
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
    .urlInput{
        width: 240px;
        font-size: 12px;
        resize: none;
        word-break: break-all;
    }
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