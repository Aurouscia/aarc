import { optimize } from 'svgo/browser';

export interface OptimizeSvgOptions {
    multipass?: boolean;
    floatPrecision?: number;
}

export function optimizeSvg(svgStr: string, options?: OptimizeSvgOptions): string {
    const { multipass = true, floatPrecision = 4 } = options ?? {}
    const result = optimize(svgStr, {
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
