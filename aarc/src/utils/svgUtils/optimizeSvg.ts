import { restoreUrlFromProxyIfNeeded } from '@/utils/urlUtils/proxyUrl';

export interface OptimizeSvgOptions {
    multipass?: boolean;
    floatPrecision?: number;
}

export async function optimizeSvg(svgStr: string, options?: OptimizeSvgOptions): Promise<string> {
    const { multipass = true, floatPrecision = 4 } = options ?? {}
    const restoredSvgStr = restoreUrlFromProxyIfNeeded(svgStr, 'icon')
    const { optimize } = await import('svgo/browser')
    const result = optimize(restoredSvgStr, {
        multipass,
        floatPrecision,
        plugins: [
            {
                name: 'preset-default',
                params: {
                    overrides: {
                        cleanupIds: false,
                        removeViewBox: false
                    }
                }
            }
        ]
    })
    return result.data
}
