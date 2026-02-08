<script setup lang="ts">
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useCommonLocalConfigStore } from '@/app/localConfig/commonLocalConfig';
import FaqAsConfig from '@/components/sidebars/configs/FaqAsConfig.vue';

const common = useCommonLocalConfigStore()
const uniq = useUniqueComponentsStore()
function removeFaqFromTopbar(){
    if(window.confirm('您已非常熟悉本项目，不再需要看这里？')){
        common.showFaqOnTopbar=false
        uniq.showPop('刷新后生效', 'success')
    }
}
function recoverFaqToTopbar(){
    common.showFaqOnTopbar=true
    uniq.showPop('刷新后生效', 'success')
}
</script>

<template>
<h1>
    常见问题
    <span style="letter-spacing: normal;font-size: 15px;">更新于2026-01-25</span>
</h1>
<div style="text-align: center;margin-bottom: 10px;">
    <button v-if="common.showFaqOnTopbar" @click="removeFaqFromTopbar">从顶部栏移除本页面</button>
    <button v-else @click="recoverFaqToTopbar">恢复本页面到顶部栏</button>
</div>
<FaqAsConfig :default-show="true" :no-title="true">
</FaqAsConfig>
</template>

<style scoped lang="scss">

</style>