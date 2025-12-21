<script setup lang="ts">
import { useConfigStore } from '@/models/stores/configStore';
import ConfigSection from './shared/ConfigSection.vue';
import copy from 'copy-to-clipboard'
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { ref } from 'vue';
import { useEnvStore } from '@/models/stores/envStore';

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
    <p class="smallNote">
        若遇到“剪切板长度限制”等问题，请及时反馈
    </p>
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