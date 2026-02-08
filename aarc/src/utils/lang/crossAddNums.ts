export function crossAddNums(arr1: number[], arr2: number[]): number[] {
    const resultSet = new Set<number>();
    for (let i = 0; i < arr1.length; i++) {
        for (let j = 0; j < arr2.length; j++) {
            resultSet.add(arr1[i]*1 + arr2[j]*1); //防止字符串相加
        }
    }
    return Array.from(resultSet);
}