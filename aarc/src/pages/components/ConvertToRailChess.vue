<script lang="ts" setup>
import { SaveDto } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import SideBar from '@/components/common/SideBar.vue';
import { ref } from 'vue';

const props = defineProps<{
    save:SaveDto
}>()
const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const domain = import.meta.env.VITE_RailChess

/** 上传存档数据到railChess实例，接口格式参考railChess项目 */
async function uploadToRailChess(){
    if(!domain || typeof domain != 'string' || !props.save.id)
        return
    const saveData = await api.save.loadData(props.save.id, false)
    if(!saveData){
        showPop('未能获取存档数据', 'failed')
        return
    }
    let url = domain
    if (!url.endsWith('/'))
        url += '/'
    url += 'api/AarcConvert/UploadSave'
    const file = new Blob([saveData], { type: "application/json" });
    const formData = new FormData();
    formData.append("save", file, 'aarc-save.json')
    const resp = await fetch(url, {
        method: 'POST',
        body: formData
    })
    let respObj;
    try{
        respObj = await resp.json()
    }
    catch{
        showPop('rc接口返回异常(解析失败)', 'failed')
        return
    }
    if(typeof respObj != 'object'){
        showPop('rc接口返回异常(非对象)', 'failed')
        return
    }
    const { data, errmsg } = respObj
    if(typeof data?.md5 == 'string'){
        showPop('上传成功！', 'success')
    }
    else{
        showPop('rc: ' + errmsg || 'rc接口返回异常(无md)', 'failed')
    }
}

const sidebar = ref<InstanceType<typeof SideBar>>()
function extend(){
    sidebar.value?.extend()
}
defineExpose({extend})
</script>

<template>
<SideBar ref="sidebar">
    <h1>转换为轨交棋地图</h1>
    <template v-if="domain">
        <div class="smallNote">
            轨交棋是一款多人在线策略游戏，玩家可以在地铁图按线路上移动，占领车站，堵截其他玩家的行动，最终获取最高分数赢得胜利<br/>
            转换前，请确保在<a :href="domain" target="_blank">轨交棋平台</a>中注册了账号
        </div>
        <button @click="uploadToRailChess" class="upload-btn">上传存档并跳转</button>
    </template>
    <div v-else class="smallNoteVital">
        请在env文件中配置轨交棋实例域名
    </div>
</SideBar>
</template>

<style lang="scss" scoped>
.upload-btn {
    display: block;
    margin: auto;
    margin-top: 20px;
}
</style>