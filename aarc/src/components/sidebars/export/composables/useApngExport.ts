import UPNG from 'upng-js'
import { useAnimatedExport, type AnimatedExportOptions } from './useAnimatedExport';

export interface ApngExportOptions extends AnimatedExportOptions {
    fileName: string
}

export function useApngExport() {
    const {
        exporting,
        exported,
        exportFailedMsg,
        startExport,
        finishExport,
        setExportFailed,
        renderFrames,
        cleanup,
        downloadBlob
    } = useAnimatedExport()

    async function exportApng(options: ApngExportOptions): Promise<void> {
        const { fileName } = options

        startExport()

        const result = await renderFrames(options)
        if (!result) {
            finishExport()
            return
        }

        const { frames, canvasSize } = result

        try {
            // 转换 FrameData 为 UPNG 需要的格式
            const frameBuffers = frames.map(f => f.imageData.data.buffer.slice(0))
            const delays = frames.map(f => f.delayMs)

            // 编码为 APNG
            const apngBuffer = UPNG.encode(frameBuffers, canvasSize, canvasSize, 0, delays)
            const blob = new Blob([apngBuffer], { type: 'image/png' })

            const finalFileName = fileName.replace(/\.\w+$/, '.png')
            downloadBlob(blob, finalFileName)
        } catch (e) {
            console.error(e)
            setExportFailed('生成动图时出错')
        } finally {
            cleanup()
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
