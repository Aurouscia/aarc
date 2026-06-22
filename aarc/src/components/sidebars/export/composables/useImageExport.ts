import { ref } from 'vue';
import { useBrowserInfoStore } from '@/app/globalStores/browserInfo';
import { useExportLocalConfigStore } from '@/app/localConfig/exportLocalConfig';
import { useApiStore } from '@/app/com/apiStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { useRoute } from 'vue-router';
import { editorParamNameSaveId } from '@/pages/editors/routes/routesNames';
import { timeStr } from '@/utils/timeUtils/timeStr';
import { storeToRefs } from 'pinia';

export function useImageExport() {
    const { browserInfo, isIPhoneOrIPad, isWebkit } = storeToRefs(useBrowserInfoStore())
    const exportLocalConfig = useExportLocalConfigStore()
    const { fileNameStyle } = storeToRefs(exportLocalConfig)
    const api = useApiStore()
    const saveStore = useSaveStore()
    const route = useRoute()
    
    const exporting = ref<boolean>(false)
    const exported = ref<boolean>(false)
    const exportFailedMsg = ref<false | string>(false)

    const downloadAnchorElementId = 'downloadAnchor'

    function getDownloadAnchor(): HTMLElement | null {
        return document.getElementById(downloadAnchorElementId)
    }

    function canEncodeWebP(): boolean {
        const c = document.createElement('canvas');
        return c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    async function cvsToDataUrl(
        cvs: OffscreenCanvas, 
        fileFormat: 'png' | 'webp' | 'jpeg' | 'svg', 
        fileQuality: number
    ): Promise<string> {
        let mime = 'image/png'
        if (fileFormat == 'webp')
            mime = 'image/webp'
        else if (fileFormat == 'jpeg')
            mime = 'image/jpeg'

        if (mime == 'image/webp' && !canEncodeWebP()) {
            const bi = browserInfo.value
            let msg = "当前环境不支持webp格式，请咨询管理员"
            if (isIPhoneOrIPad.value)
                msg = `当前设备（iPhone/iPad）不支持webp格式`
            else if (isWebkit.value)
                msg = `当前浏览器（${bi.browser.name}，${bi.engine.name}内核）不支持webp格式`
            throw new Error(msg)
        }

        const blob = await cvs.convertToBlob({ type: mime, quality: fileQuality });
        return URL.createObjectURL(blob);
    }

    function triggerDownload(url: string, fileName: string): void {
        const link = getDownloadAnchor()
        if (link && 'href' in link) {
            exported.value = true
            link.href = url;
            if ('download' in link)
                (link as HTMLAnchorElement).download = fileName
            link.click();
        }
    }

    function resetExportState(): void {
        exported.value = false
        exporting.value = false
        exportFailedMsg.value = false
    }

    function startExport(): void {
        exported.value = false
        exporting.value = true
        exportFailedMsg.value = false
    }

    function finishExport(): void {
        exporting.value = false
    }

    function setExportFailed(msg: string): void {
        exportFailedMsg.value = msg
        exporting.value = false
    }

    async function getExportFileName(ext?: string, suffix?: string): Promise<string | undefined> {
        let saveId = route.params[editorParamNameSaveId]
        if (typeof saveId === 'object')
            saveId = saveId[0] || 'err'
        const saveIdNum = parseInt(saveId)
        let saveName: string
        if (isNaN(saveIdNum))
            saveName = saveId
        else {
            const info = await api.save.loadInfo(saveIdNum)
            saveName = info?.name ?? '??'
        }
        let name = ''
        const style = fileNameStyle.value
        if (style == 'date')
            name = `${saveName}-${timeStr('date')}`
        else if (style == 'dateTime')
            name = `${saveName}-${timeStr('dateTime')}`
        else if (style == 'lineCount') {
            const lineCount = saveStore.getLineCount()
            const staCount = saveStore.getStaCount()
            name = `${saveName}-${lineCount}线${staCount}站`
        } else {
            name = saveName ?? '未命名'
        }
        if (suffix) {
            name = `${name}-${suffix}`
        }
        if (ext) {
            return `${name}.${ext}`
        }
        return name
    }

    return {
        // state
        exporting,
        exported,
        exportFailedMsg,
        // constants
        downloadAnchorElementId,
        // methods
        getDownloadAnchor,
        canEncodeWebP,
        cvsToDataUrl,
        triggerDownload,
        getExportFileName,
        resetExportState,
        startExport,
        finishExport,
        setExportFailed
    }
}
