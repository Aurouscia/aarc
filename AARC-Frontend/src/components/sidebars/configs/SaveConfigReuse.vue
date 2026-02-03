<script setup lang="ts">
import { useConfigStore } from '@/models/stores/configStore';
import ConfigSection from './shared/ConfigSection.vue';
import copy from 'copy-to-clipboard'
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { ref } from 'vue';
import { useEnvStore } from '@/models/stores/envStore';
import Notice from '@/components/common/Notice.vue';

const cs = useConfigStore()
const envStore = useEnvStore()
const { showPop } = useUniqueComponentsStore()

function exportToClipboard() {
    copy(JSON.stringify(cs.getConfigForExporting()))
    showPop('已复制到剪切板', 'success')
}
function exportToFile(){
    const blob = new Blob([JSON.stringify(cs.getConfigForExporting())], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'config.json'
    a.click()
    URL.revokeObjectURL(url)
}

const wantToImport = ref(false)
const importedConfigJson = ref('')
function importFromClipboard() {
    if(window.confirm('确定要导入配置？这会覆盖当前存档的配置，请仔细确认！'))
        wantToImport.value = true
}
function handleInputChange(){
    try {
        const config = JSON.parse(importedConfigJson.value)
        cs.importConfig(config)
        showPop('导入成功','success')
        wantToImport.value = false
        importedConfigJson.value = ''
        envStore.rerender()
    }
    catch (e) {
        console.error(e)
        showPop('导入失败，请检查格式是否正确', 'failed')
        importedConfigJson.value = ''
    }
}
</script>

<template>
<ConfigSection :title="'存档配置导入/导出'">
<div class="configReuseBody">
    <p class="smallNote">
        存档配置导入/导出功能可以将存档配置从一个存档导出，并导入到另一个存档，这对于创建新存档，或者将存档配置与他人共享非常有用
    </p>
    <button @click="exportToClipboard" class="ok">导出到剪切板</button>
    <button @click="exportToFile" class="ok">导出到json文件</button>
    <button @click="importFromClipboard">从剪切板导入</button>
    <input v-if="wantToImport" v-model="importedConfigJson" placeholder="请粘贴在此"
        @change="handleInputChange"/>
    <Notice :type="'warn'">
        “存档配置”和“存档”是两个概念，存档配置仅指线路样式、字体大小等部分，不包括线路和车站。
        如果需要导入/导出整个存档，请前往“我的存档-信息设置”找到导出工程文件和替换存档数据。
    </Notice>
</div>
</ConfigSection>
</template>

<style scoped>
.configReuseBody{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}
</style>