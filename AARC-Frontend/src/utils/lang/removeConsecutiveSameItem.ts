/** 去除数组中连续的相同项 */
export function removeConsecutiveSameItem<T>(array: T[]): T[] {
    if (!array.length) return [];

    const result: T[] = [array[0]];
    for (let i = 1; i < array.length; i++) {
        if (array[i] !== array[i - 1]) {
            result.push(array[i]);
        }
    }
    return result;
}