
import { useLineTimeStore } from '@/models/stores/saveDerived/lineTimeStore';
import { useRenderOptionsStore } from '@/models/stores/renderOptionsStore';
import { useMiniatureCvsDispatcher } from '@/models/cvs/dispatchers/miniatureCvsDispatcher';
import { useImageExport } from './useImageExport';
import { storeToRefs } from 'pinia';
import { useExportLocalConfigStore } from '@/app/localConfig/exportLocalConfig';
import { clamp } from '@/utils/lang/clamp';

export interface FrameData {
    imageData: ImageData
    delayMs: number
}

export interface AnimatedExportOptions {
    canvasSize?: number
    lineWidth?: number
    frameDelayMs?: number
}

export interface RenderedFramesResult {
    frames: FrameData[]
    canvasSize: number
}

export function useAnimatedExport() {
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
    const { animationMini: animConfig } = storeToRefs(useExportLocalConfigStore())

    /**
     * 获取动画时间点（包含初始状态）
     */
    function getAnimationTimePoints(): number[] | null {
        const { getUniqueTimeValues } = useLineTimeStore()
        const timePoints = getUniqueTimeValues({
            types: ['open'],
            onlyOpened: true
        })

        if (timePoints.length < 2) {
            return null
        }

        // 在开头添加一个时间点，展示初始状态
        const firstTime = timePoints.at(0) ?? 0
        timePoints.unshift(firstTime - 10)

        return timePoints
    }

    /**
     * 渲染所有帧（通用逻辑）
     */
    async function renderFrames(options: AnimatedExportOptions): Promise<RenderedFramesResult | null> {
        let {
            canvasSize = 256,
            lineWidth = 2,
            frameDelayMs = animConfig.value.interval
        } = options

        if(typeof frameDelayMs != 'number')
            frameDelayMs = 800
        frameDelayMs = clamp(frameDelayMs, 100, 3000)

        const { linesSortedByOpenState, linesFilteredByOpenState } = storeToRefs(useLineTimeStore())
        const lines = animConfig.value.hideNotOpened ?  linesFilteredByOpenState : linesSortedByOpenState

        const timePoints = getAnimationTimePoints()
        if (!timePoints) {
            setExportFailed('请为线路添加\n开通时间设置')
            return null
        }

        const frames: FrameData[] = []

        try {
            for (const time of timePoints) {
                // 设置当前时间点（使用覆盖机制，不影响用户设置）
                renderOptions.setTimeMomentOverride(time)

                // 渲染缩略图帧
                const cvs = miniatureCvsDispatcher.renderMiniatureCvs({
                    sideLength: canvasSize,
                    lineWidth,
                    lines: lines.value
                })
                const ctx = cvs.getContext('2d')!
                const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height)

                // 复制数据（因为 imageData.data 会被复用）
                frames.push({
                    imageData,
                    delayMs: frameDelayMs
                })
            }

            return { frames, canvasSize }
        } catch (e) {
            console.error(e)
            setExportFailed('渲染帧时出错')
            return null
        }
    }

    /**
     * 清理资源（清除时间覆盖）
     */
    function cleanup(): void {
        renderOptions.setTimeMomentOverride(undefined)
    }

    /**
     * 创建 Blob URL 并触发下载
     */
    function downloadBlob(blob: Blob, fileName: string): void {
        const url = URL.createObjectURL(blob)
        triggerDownload(url, fileName)

        // 清理
        setTimeout(() => {
            URL.revokeObjectURL(url)
            exported.value = false
        }, 60000)
    }

    return {
        // state
        exporting,
        exported,
        exportFailedMsg,
        // methods
        startExport,
        finishExport,
        setExportFailed,
        getAnimationTimePoints,
        renderFrames,
        cleanup,
        downloadBlob
    }
}
