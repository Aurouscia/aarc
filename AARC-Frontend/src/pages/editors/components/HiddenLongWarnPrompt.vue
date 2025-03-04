<script setup lang="ts">
import Prompt from '@/components/common/Prompt.vue';

const emit = defineEmits<{
    (e:'ok'):void
}>()
</script>

<template>
<Prompt>
    <div class="hiddenLong">
        <div class="hiddenLongTitle">警告</div>
        <div>
            长时间离开前，应<b>保存</b>并<b>离开编辑器页面</b><br/>
            否则可能造成进度丢失（被浏览器清理）
        </div>
        <button @click="emit('ok')">我知道了</button>
    </div>
</Prompt>
</template>

<style scoped lang="scss">
.hiddenLong{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    color:#666;
    .hiddenLongTitle{
        color:black;
        font-size: 22px;
    }
    b{
        color:plum
    }
}
</style>