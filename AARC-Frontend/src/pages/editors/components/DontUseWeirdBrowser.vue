<script lang="ts" setup>
import { useBrowserInfoStore } from '@/app/globalStores/browserInfo';
import { useOneTimeNoticeStore } from '@/app/localConfig/oneTimeNotice';
import Prompt from '@/components/common/Prompt.vue';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const browser = useBrowserInfoStore()
const { dontUseWeirdBrowserShown } = storeToRefs(useOneTimeNoticeStore())
const show = computed<boolean>(()=>{
    let isWeirdBrowser = browser.isBaiduApp || browser.isQQBuiltIn || browser.isWxBuiltIn
    return !dontUseWeirdBrowserShown.value && isWeirdBrowser
})
const browserName = computed<string>(()=>{
    if(browser.isBaiduApp) return '百度APP'
    if(browser.isQQBuiltIn) return 'QQ'
    if(browser.isWxBuiltIn) return '微信'
        return '当前浏览器'
})
</script>

<template>
<Prompt v-show="show" :bg-click-close="false" :close-btn="true" :close-btn-delay="5" @close="dontUseWeirdBrowserShown=true">
    本应用在<b class="wrong">{{ browserName }}</b>中可能无法正常工作<br/>
    建议复制链接到<b class="right">Chrome</b>或<b class="right">Edge</b>浏览器打开本应用，以获得最佳体验
</Prompt>
</template>

<style lang="scss" scoped>
b{
    margin: 0px 2px;
}
.wrong{
    color: red;
}
.right{
    color: green;
}
</style>