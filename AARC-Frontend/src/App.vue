<script setup lang="ts">
import Pop from './components/common/Pop.vue';
import Wait from './components/common/Wait.vue';
import { useUniqueComponentsStore } from './app/globalStores/uniqueComponents';
import { storeToRefs } from 'pinia';
import TopbarParent from './components/common/topbar/TopbarParent.vue';
import Footer from './components/common/Footer.vue';
import { onMounted, useTemplateRef } from 'vue';

const uniq = useUniqueComponentsStore()
const { topbarShow } = storeToRefs(uniq)

const pop = useTemplateRef('pop')
const wait = useTemplateRef('wait')
onMounted(()=>{
    uniq.initCallbacks({
        popCallback: (msg, type)=>{
            pop.value?.show(msg, type)
        },
        waitCallback: (reason, value)=>{
            wait.value?.setShowing(reason, value)
        }
    })
})
</script>

<template>
<TopbarParent v-if="topbarShow"></TopbarParent>
<div class="mainOuter">
    <div class="main">
        <RouterView></RouterView>
        <Footer v-if="topbarShow"></Footer>
    </div>
</div>
<Pop ref="pop"></Pop>
<Wait ref="wait"></Wait>
</template>

<style scoped lang="scss">
@use '@/styles/globalValues';

.mainOuter{
    width: 100vw;
    position: absolute; //只能absolute不能fixed
    top: globalValues.$topbar-height;
    height: globalValues.$body-height;
    transition: 0s;
    overflow: auto;
}

.main{
    width: calc(100vw - 2 * globalValues.$mainDivLRMargin);
    margin: auto;
    margin-top: 0px;
    height: globalValues.$body-height;
    box-sizing: border-box;
    max-width: 1400px;
    transition: 0s;
}
</style>