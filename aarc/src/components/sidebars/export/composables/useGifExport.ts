import { GifWriter } from 'omggif';
import { useAnimatedExport, type AnimatedExportOptions } from './useAnimatedExport';

export interface GifExportOptions extends AnimatedExportOptions {
    fileName: string
}

export function useGifExport() {
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

    async function exportGif(options: GifExportOptions): Promise<void> {
        const { fileName } = options

        startExport()

        const result = await renderFrames(options)
        if (!result) {
            finishExport()
            return
        }

        const { frames, canvasSize } = result

        try {
            // 计算 GIF 文件大小
            // GIF 使用调色板，需要将 RGBA 转换为索引色
            const buffer = new Uint8Array(canvasSize * canvasSize * frames.length + 1024 * 1024)
            const gifWriter = new GifWriter(buffer, canvasSize, canvasSize, { loop: 0 })

            for (const frame of frames) {
                const { imageData, delayMs } = frame
                const { data, width, height } = imageData

                // 简单的调色板量化（使用基本调色板）
                const palette = buildSimplePalette(data)
                const indexedData = convertToIndexed(data, palette)

                // 将 delayMs 转换为百分之一秒
                const delayInCentisecs = Math.max(2, Math.round(delayMs / 10))

                // 将 Uint8Array 转换为 number[] 以符合类型定义
                gifWriter.addFrame(0, 0, width, height, Array.from(indexedData), {
                    delay: delayInCentisecs,
                    palette: palette
                })
            }

            // 截取实际使用的 buffer
            const usedBuffer = buffer.slice(0, gifWriter.end())
            const blob = new Blob([usedBuffer], { type: 'image/gif' })

            const finalFileName = fileName.replace(/\.\w+$/, '.gif')
            downloadBlob(blob, finalFileName)
        } catch (e) {
            console.error(e)
            setExportFailed('生成 GIF 时出错')
        } finally {
            cleanup()
            finishExport()
        }
    }

    return {
        exporting,
        exported,
        exportFailedMsg,
        exportGif
    }
}

/**
 * 构建调色板，使用更精确的量化策略
 * 优先保留实际出现的颜色，而不是预定义桶
 */
function buildSimplePalette(rgbaData: Uint8ClampedArray): number[] {
    const palette: number[] = new Array(256).fill(0)
    
    // 统计每种颜色的出现频率（使用 5-5-5 量化，共 32768 种可能，然后取前 255 个）
    const colorMap = new Map<number, { count: number, avgR: number, avgG: number, avgB: number }>()
    
    for (let i = 0; i < rgbaData.length; i += 4) {
        const r = rgbaData[i]
        const g = rgbaData[i + 1]
        const b = rgbaData[i + 2]
        const a = rgbaData[i + 3]
        
        // 跳过透明像素
        if (a < 128) continue
        
        // 使用 5-5-5 量化（每个通道 5-bit，共 32 级）
        // 这样既控制颜色数量，又保留足够精度
        const quantized = 
            (Math.floor(r / 8) << 10) |
            (Math.floor(g / 8) << 5) |
            Math.floor(b / 8)
        
        const existing = colorMap.get(quantized)
        if (existing) {
            existing.count++
            // 累计平均值
            existing.avgR = (existing.avgR * (existing.count - 1) + r) / existing.count
            existing.avgG = (existing.avgG * (existing.count - 1) + g) / existing.count
            existing.avgB = (existing.avgB * (existing.count - 1) + b) / existing.count
        } else {
            colorMap.set(quantized, { count: 1, avgR: r, avgG: g, avgB: b })
        }
    }
    
    // 按频率排序
    const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 255) // 留一个索引给透明色
    
    // 填充调色板（使用实际平均颜色值）
    for (let i = 0; i < sortedColors.length; i++) {
        const { avgR, avgG, avgB } = sortedColors[i][1]
        const r = Math.round(avgR)
        const g = Math.round(avgG)
        const b = Math.round(avgB)
        palette[i] = (r << 16) | (g << 8) | b
    }
    
    // 确保黑色和白色在调色板中（如果图像中有接近的颜色）
    // 这样极端颜色不会偏差太远
    const hasBlack = sortedColors.some(([_, v]) => 
        v.avgR < 32 && v.avgG < 32 && v.avgB < 32
    )
    const hasWhite = sortedColors.some(([_, v]) => 
        v.avgR > 224 && v.avgG > 224 && v.avgB > 224
    )
    
    let nextIndex = sortedColors.length
    if (!hasBlack && nextIndex < 255) {
        palette[nextIndex++] = 0x000000
    }
    if (!hasWhite && nextIndex < 255) {
        palette[nextIndex++] = 0xFFFFFF
    }
    
    return palette
}

/**
 * 将 RGBA 数据转换为索引色数据
 */
function convertToIndexed(rgbaData: Uint8ClampedArray, palette: number[]): Uint8Array {
    const indexed = new Uint8Array(rgbaData.length / 4)
    
    for (let i = 0, j = 0; i < rgbaData.length; i += 4, j++) {
        const r = rgbaData[i]
        const g = rgbaData[i + 1]
        const b = rgbaData[i + 2]
        const a = rgbaData[i + 3]
        
        // 透明像素映射到调色板索引 0
        if (a < 128) {
            indexed[j] = 0
            continue
        }
        
        // 找到最接近的颜色（palette 是 0xRRGGBB 格式）
        let minDist = Infinity
        let bestIndex = 0
        
        for (let p = 0; p < 256; p++) {
            const packed = palette[p]
            const pr = (packed >> 16) & 0xFF
            const pg = (packed >> 8) & 0xFF
            const pb = packed & 0xFF
            
            const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
            if (dist < minDist) {
                minDist = dist
                bestIndex = p
            }
        }
        
        indexed[j] = bestIndex
    }
    
    return indexed
}


