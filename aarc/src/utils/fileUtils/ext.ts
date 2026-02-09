/**
 * 获取文件的小写后缀名（不含点号）
 * @param fileName 文件名
 * @returns 小写后缀名，如果没有后缀则返回空字符串
 */
export function getExt(fileName: string | undefined): string {
    if (!fileName) {
        return '';
    }
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
        return '';
    }
    return fileName.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * 判断文件是否为 SVG
 * @param fileName 文件名
 * @returns 是否为 SVG 文件
 */
export function isSvg(fileName: string | undefined): boolean {
    return getExt(fileName) === 'svg';
}
