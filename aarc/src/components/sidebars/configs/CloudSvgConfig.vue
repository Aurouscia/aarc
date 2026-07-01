<script setup lang="ts">
import { useSaveStore } from '@/models/stores/saveStore';
import ConfigSection from './shared/ConfigSection.vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { renderAndUploadCloudSvg } from '@/models/save/cloudSvgOps';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { editorParamNameSaveId } from '@/pages/editors/routes/routesNames';
import copy from 'copy-to-clipboard'

const saveStore = useSaveStore()
const { save } = storeToRefs(saveStore)
const { showPop } = useUniqueComponentsStore()
const route = useRoute()

if (save.value) {
    save.value.meta ??= {}
    save.value.meta.autoUpdateCloudSvg ??= {}
    save.value.meta.autoUpdateCloudSvg.enabled ??= false
}

function getCurrentSaveId(): number | undefined {
    const saveIdRaw = route.params[editorParamNameSaveId]
    const saveIdStr = Array.isArray(saveIdRaw) ? saveIdRaw[0] : saveIdRaw
    const saveId = parseInt(saveIdStr ?? '')
    if (isNaN(saveId))
        return undefined
    return saveId
}

async function manualUpdate() {
    const saveId = getCurrentSaveId()
    if (saveId === undefined) {
        showPop('无法获取当前存档ID', 'failed')
        return
    }
    const res = await renderAndUploadCloudSvg(saveId)
    if (res)
        showPop('云端SVG已更新', 'success')
}

function copyShareLink() {
    const saveId = getCurrentSaveId()
    if (saveId === undefined) {
        showPop('无法获取当前存档ID', 'failed')
        return
    }
    const baseUrl = import.meta.env.VITE_ApiUrlBase as string | undefined
    const shareUrl = `${(baseUrl || window.location.origin).replace(/\/$/, '')}/save-svg/${saveId}.svg`
    copy(shareUrl)
    showPop('已复制到剪切板', 'success')
}
</script>

<template>
<ConfigSection :title="'云端SVG'">
    <table class="fullWidth"><tbody>
        <tr>
            <td colspan="2">
                <button class="ok" @click="manualUpdate">手动更新</button>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <button @click="copyShareLink">复制线路图分享链接</button>
            </td>
        </tr>
        <tr>
            <td>保存时自动更新</td>
            <td>
                <input
                    v-if="save?.meta.autoUpdateCloudSvg"
                    v-model="save.meta.autoUpdateCloudSvg.enabled"
                    type="checkbox"/>
            </td>
        </tr>
        <tr>
            <td colspan="2" class="explain">
                开启后，每次保存存档时会自动生成并上传最新SVG到云端，可通过固定URL在img标签中引用。
            </td>
        </tr>
    </tbody></table>
</ConfigSection>
</template>
