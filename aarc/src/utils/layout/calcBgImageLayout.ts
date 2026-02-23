export interface BgImageLayoutConfig {
    width?: number;
    height?: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    opacity?: number;
}

export interface BgImageLayoutResult {
    left: number;
    top: number;
    width: number;
    height: number;
    opacity: number;
}

/**
 * 计算背景图片在画布上的布局（左、上、宽、高）
 * @param cfg - 用户配置
 * @param cvsWidth - 画布宽度
 * @param cvsHeight - 画布高度
 * @param imgNaturalWidth - 图片原始宽度
 * @param imgNaturalHeight - 图片原始高度
 */
export function calcBgImageLayout(
    cfg: BgImageLayoutConfig,
    cvsWidth: number,
    cvsHeight: number,
    imgNaturalWidth: number,
    imgNaturalHeight: number
): BgImageLayoutResult | undefined {
    const whRatio = imgNaturalWidth / imgNaturalHeight;
    if (!whRatio || isNaN(whRatio)) {
        return undefined;
    }

    let { width, height, left, right, top, bottom } = cfg;

    // 计算逻辑与原来保持一致
    if (!width && typeof left === 'number' && typeof right === 'number') {
        width = cvsWidth - left - right;
    }
    if (!height && typeof top === 'number' && typeof bottom === 'number') {
        height = cvsHeight - top - bottom;
    }
    if (!width && height) {
        width = height * whRatio;
    }
    if (!height && width) {
        height = width / whRatio;
    }
    if (typeof left !== 'number' && typeof width === 'number' && typeof right === 'number') {
        left = cvsWidth - width - right;
    }
    if (typeof top !== 'number' && typeof height === 'number' && typeof bottom === 'number') {
        top = cvsHeight - height - bottom;
    }

    return {
        left: left ?? 0,
        top: top ?? 0,
        width: width ?? cvsWidth,
        height: height ?? cvsHeight,
        opacity: (cfg.opacity ?? 100) / 100
    };
}
