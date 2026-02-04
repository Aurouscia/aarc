<script setup lang="ts">
import { convertLineSeppedToCommaSepped } from '@/utils/lang/fontStr';
import { computed } from 'vue';

const fonts = defineModel<string>()

const commaSepValue = computed(()=>{
    return convertLineSeppedToCommaSepped(fonts.value)
})
</script>

<template>
    <div class="font-input">
        <textarea
            v-model="fonts"
            placeholder="请输入字体名称&#10;每行一个"
            rows="3"
        ></textarea>
        <div v-if="commaSepValue" class="display-demo" :style="{fontFamily: commaSepValue}">
            测试文本<br/>DemoText
        </div>
    </div>
</template>

<style scoped lang="scss">
.font-input {
    display: flex;
    flex-direction: column;
    gap: 4px;

    textarea{
        white-space: nowrap;
        margin: 0px;
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
