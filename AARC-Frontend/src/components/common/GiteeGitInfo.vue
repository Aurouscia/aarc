<script setup lang="ts">
import { onMounted, ref } from 'vue';

const widgeturl = "https://gitee.com/au114514/aarc/widget_preview"
const scriptContainer = ref<HTMLDivElement>()
const gitWidget = ref<HTMLDivElement>()

onMounted(()=>{
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
    <div ref="scriptContainer"></div>
    <div ref="gitWidget" id="osc-gitee-widget-tag"></div>
    <div class="smallNote" style="text-align: center;">
        代码提交不代表实际运营情况，发布可能存在延迟。
    </div>
    <div class="smallNote" style="text-align: center;">
        本项目为滚动更新，无“版本号”概念。
        <a href="http://wiki.jowei19.com/#/w/aarc-update-log">更新日志</a>
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