//保持原始顺序的排序
export function keepOrderSort<T>(arr: T[], compare: (a: T, b: T) => number) {
    const originalPos = new Map<T, number>();
    arr.forEach((item, index) => {
        originalPos.set(item, index);
    })
    arr.sort((a, b) => {
        const result = compare(a, b);
        if (result === 0) {
            return originalPos.get(a)! - originalPos.get(b)!;
        }
        return result;
    })
}