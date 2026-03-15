import { useLineTimeStore } from '@/models/stores/saveDerived/lineTimeStore';
import { useRenderOptionsStore } from '@/models/stores/renderOptionsStore';
import { useMiniatureCvsDispatcher } from '@/models/cvs/dispatchers/miniatureCvsDispatcher';
import UPNG from 'upng-js'
import { useImageExport } from './useImageExport';

export interface ApngExportOptions {
    fileName: string
    canvasSize?: number
    scale?: number
    frameDelayMs?: number
}

export function useApngExport() {
    const { 
        exporting, 
        exported, 
        exportFailedMsg, 
        startExport, 
        finishExport, 
        setExportFailed,
        triggerDownload 
    } = useImageExport()
    
    const miniatureCvsDispatcher = useMiniatureCvsDispatcher()
    const renderOptions = useRenderOptionsStore()

    async function exportApng(options: ApngExportOptions): Promise<void> {
        const { 
            fileName, 
            canvasSize = 256, 
            scale = 2, 
            frameDelayMs = 800 
        } = options

        startExport()

        // 获取所有关键时间点（只包含 open 事件）
        const { getUniqueTimeValues } = useLineTimeStore()
        const timePoints = getUniqueTimeValues({
            types: ['open'],
            onlyOpened: true
        })

        if (timePoints.length < 2) {
            setExportFailed('请为线路添加\n开通时间设置')
            return
        }

        // 在开头添加一个时间点，展示初始状态
        let firstTime = timePoints.at(0) ?? 0
        timePoints.unshift(firstTime - 10)

        const frames: ArrayBuffer[] = []
        const delays: number[] = []

        try {
            for (const time of timePoints) {
                // 设置当前时间点（使用覆盖机制，不影响用户设置）
                renderOptions.setTimeMomentOverride(time)

                // 渲染缩略图帧
                const cvs = miniatureCvsDispatcher.renderMiniatureCvs(canvasSize, scale)
                const ctx = cvs.getContext('2d')!
                const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height)

                // 复制数据（因为 imageData.data 会被复用）
                frames.push(imageData.data.buffer.slice(0))
                delays.push(frameDelayMs)
            }

            // 编码为 APNG
            const apngBuffer = UPNG.encode(frames, canvasSize, canvasSize, 0, delays)
            const blob = new Blob([apngBuffer], { type: 'image/png' })
            const url = URL.createObjectURL(blob)

            // 下载
            const finalFileName = fileName.replace(/\.\w+$/, '.png') // 确保扩展名为 png
            triggerDownload(url, finalFileName)

            // 清理
            setTimeout(() => {
                URL.revokeObjectURL(url)
                exported.value = false
            }, 60000)
        }
        catch (e) {
            console.error(e)
            setExportFailed('生成动图时出错')
        }
        finally {
            // 清除时间覆盖，恢复用户设置
            renderOptions.setTimeMomentOverride(undefined)
            finishExport()
        }
    }

    return {
        exporting,
        exported,
        exportFailedMsg,
        exportApng
    }
}
