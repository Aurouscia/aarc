<script setup lang="ts">
import { SaveBackupInfo } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { fileSizeDisplay } from '@/utils/dataUtils/fileSizeDisplay';
import { onMounted, ref } from 'vue';
import fileDownload from 'js-file-download';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';

const props = defineProps<{
    saveId: number
}>()
const api = useApiStore()
const { showPop } = useUniqueComponentsStore()

const backups = ref<SaveBackupInfo[]>([])
async function load() {
    const res = await api.save.getBackupList(props.saveId)
    if(res){
        backups.value = res
    }
}

async function download(fileName?:string) {
    if(!fileName) return
    const res = await api.save.downloadBackup(props.saveId, fileName)
    if(res){
        fileDownload(res.data, fileName)
    }
}

async function apply(fileName?:string) {
    if(!fileName) return
    if(!window.confirm('确定使用备份内容替换当前存档数据？当前存档数据将丢失！'))
        return
    const backup = window.confirm('替换前，备份一次当前存档数据？（推荐）')
    const res = await api.save.applyBackup(props.saveId, fileName, backup)
    if(res){
        await load()
        showPop('操作成功', 'success')
    }
}

onMounted(async()=>{
    await load()
})
</script>

<template>
<table class="fullWidth">
    <tr v-for="b in backups">
        <td>
            <div class="file-time">{{ b.createTime }}</div>
            <div class="file-size">—{{ fileSizeDisplay(b.fileSize ?? 0) }}—</div>
        </td>
        <td class="ops">
            <button class="lite confirm" @click="download(b.fileName)">下载</button>
            <button class="lite" @click="apply(b.fileName)">取用</button>
        </td>
    </tr>
</table>
</template>

<style lang="scss" scoped>
.file-time{
    font-size: 14px;
}
.file-size{
    font-size: 14px;
    color: #999;
}
.ops{
    button:last-child{
        margin-left: 10px;
    }
}
</style>