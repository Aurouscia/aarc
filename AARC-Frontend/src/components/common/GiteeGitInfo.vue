<script setup lang="ts">
import { GitInfo } from '@/utils/gitInfo/gitInfo';
import { getGitInfo } from '@/utils/gitInfo/gitInfoGet';
import { onMounted, ref } from 'vue';

const widgeturl = "https://gitee.com/au114514/aarc/widget_preview"
const scriptContainer = ref<HTMLDivElement>()
const gitWidget = ref<HTMLDivElement>()
const gitInfo = ref<GitInfo>()

onMounted(()=>{
    getGitInfo().then((info)=>{
        gitInfo.value = info
    })

    if(!scriptContainer.value){
        return;
    }
    const script = document.createElement("script");
    scriptContainer.value.appendChild(script);
    script.src = widgeturl
    script.async = true;
    script.defer = true;

    let timer = setInterval(()=>{
        if(!gitWidget.value?.children.length){
            return;
        }
        clearInterval(timer);
        const anchors = gitWidget.value.getElementsByTagName("a");
        for(const a of anchors){
            a.setAttribute("target","_blank");
        }
    },100);
})
</script>

<template>
    <div v-if="gitInfo" class="gitInfo">
        <div>提交ID：{{ gitInfo.commitId }}</div>
        <div>构建于：{{ gitInfo.builtAt }}</div>
    </div>
    <div ref="scriptContainer"></div>
    <div ref="gitWidget" id="osc-gitee-widget-tag"></div>
    <div class="smallNote" style="text-align: center; margin-top: 8px;">
        github/gitee中的代码提交不代表实际运营情况，发布可能存在延迟。
    </div>
</template>

<style>
    .osc_pro_color {color: #4183c4 !important;}
    .osc_panel_color {background-color: #ffffff !important;}
    .osc_background_color {background-color: #ffffff !important;}
    .osc_border_color {border-color: #e3e9ed !important;}
    .osc_desc_color {color: #666666 !important;}
    .osc_link_color * {color: #9b9b9b !important;}
</style>

<style lang="scss" scoped>
.gitInfo{
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin: 15px 0px 10px;
    &>div{
        font-size: 14px;
        color: #666;
        background-color: #eee;
        padding: 5px 10px;
        border-radius: 6px;
    }
}
</style>