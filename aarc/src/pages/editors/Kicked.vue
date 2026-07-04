<script lang="ts" setup>
import Notice from '@/components/common/Notice.vue';
</script>

<template>
<div class="kicked">
    <Notice :type="'danger'" :title="'很抱歉！'">
        因为太长时间没有保存操作，存档所有者认定你为挂机者，将你请出了存档。<br/>请等待一段时间后再重新进入。
    </Notice>
</div>
</template>

<style lang="scss" scoped>
.kicked{
    margin-top: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>