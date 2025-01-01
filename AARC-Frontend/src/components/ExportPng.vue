<script setup lang="ts">
import { ref } from 'vue';
import SideBar from './common/SideBar.vue';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';

const sidebar = ref<InstanceType<typeof SideBar>>()
const mainCvsDispatcher = useMainCvsDispatcher()
let exportLock = false

function downloadMainCvsAsPng() {
    if(exportLock)
        return
    exportLock = true
    mainCvsDispatcher.renderMainCvs([], [], true, true)
    var cvs = mainCvsDispatcher.mainCvs
    if(!cvs)
        return
    var dataURL = cvs.toDataURL('image/png');
    var link = document.createElement('a');
    link.download = 'canvas.png';
    link.href = dataURL;
    link.click();
    mainCvsDispatcher.renderMainCvs([], [], true, false)
    window.setTimeout(()=>{
        exportLock = false
    }, 2000)
}

defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
</script>

<template>
<SideBar ref="sidebar">
<h1>导出作品</h1>
<div class="exportOps">
    <button @click="downloadMainCvsAsPng" class="ok">导出为png格式</button>
    <div class="note">
        作品导出设置（清晰度等）将后续推出
    </div>
</div>
</SideBar>
</template>

<style scoped lang="scss">
.exportOps{
    display: flex;
    flex-direction: column;
    align-items: center;
}
.note{
    margin-top: 30px;
    font-size: 14px;
    color: #999;
    text-align: center;
}
</style>