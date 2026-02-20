<script setup lang="ts">
import { convertLineSeppedToCommaSepped } from '@/utils/lang/fontStr';
import { computed } from 'vue';

const fonts = defineModel<string | undefined>()
const fontWeight = defineModel<string | undefined>('fontWeight')
const fontStyle = defineModel<string | undefined>('fontStyle')

const commaSepValue = computed(()=>{
    return convertLineSeppedToCommaSepped(fonts.value)
})

const fontWeightOptions = [
    { value: 'lighter', label: '细' },
    { value: '', label: '标准' },
    { value: 'bold', label: '粗' },
    { value: 'bolder', label: '更粗' },
    { value: '100', label: '100' },
    { value: '200', label: '200' },
    { value: '300', label: '300' },
    { value: '400', label: '400' },
    { value: '500', label: '500' },
    { value: '600', label: '600' },
    { value: '700', label: '700' },
    { value: '800', label: '800' },
    { value: '900', label: '900' },
]

const fontStyleOptions = [
    { value: '', label: '标准' },
    { value: 'italic', label: '斜体' },
]
</script>

<template>
    <div class="font-input">
        <textarea
            v-model="fonts"
            placeholder="请输入字体名称&#10;每行一个"
            rows="3"
        ></textarea>
        <div class="selects">
            <select v-model="fontWeight">
                <option v-for="opt in fontWeightOptions" :key="opt.label" :value="opt.value">
                    {{ opt.label }}
                </option>
            </select>
            <select v-model="fontStyle">
                <option v-for="opt in fontStyleOptions" :key="opt.label" :value="opt.value">
                    {{ opt.label }}
                </option>
            </select>
        </div>
        <div v-if="commaSepValue" class="display-demo" :style="{fontFamily: commaSepValue, fontWeight: fontWeight ?? 'normal', fontStyle: fontStyle ?? 'normal'}">
            测试文本<br/>DemoText
        </div>
    </div>
</template>

<style scoped lang="scss">
.font-input {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .selects{
        display: flex;
        align-items: center;
        gap: 6px;
        select{
            width: unset;
            flex: 1;
        }
    }

    textarea, select{
        white-space: nowrap;
        margin: 0px;
        width: 190px;
        font-size: 15px;
    }

    .display-demo{
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        word-break: break-all;
        font-size: 16px;
        background-color: white;
        color: gray
    }
}
</style>
