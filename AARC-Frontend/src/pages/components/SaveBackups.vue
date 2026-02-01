<script setup lang="ts">
import { SaveBackupInfo } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { fileSizeDisplay } from '@/utils/dataUtils/fileSizeDisplay';
import { onMounted, ref } from 'vue';
import fileDownload from 'js-file-download';

const props = defineProps<{
    saveId: number
}>()
const api = useApiStore()

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

onMounted(async()=>{
    await load()
})
</script>

<template>
<table class="fullWidth">
    <tr v-for="b in backups">
        <td>
            <div>{{ b.createTime }}</div>
            <div class="file-size">—{{ fileSizeDisplay(b.fileSize ?? 0) }}—</div>
        </td>
        <td>
            <button class="lite confirm" @click="download(b.fileName)">下载</button>
        </td>
    </tr>
</table>
</template>

<style lang="scss" scoped>
.file-size{
    font-size: 14px;
    color: #999;
}
</style>